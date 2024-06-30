import {
  addVideoMetaDataInDB,
  deleteVideoFromDB,
  getAllVideos,
  getVideoByTranscodeId,
  saveVideoInDB,
} from "../db-layer/database-transactions/video.transactions.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ContainerService } from "./container.service.js";
import { RedisService } from "./redis.service.js";
import { S3Service } from "./s3.service.js";
import { v4 as uuidV4 } from "uuid";
import { getVideoDurationInSeconds } from "get-video-duration";
import { ClickHouseService } from "./clickhouse.service.js";
import { checkBuildStatus, updateVideoStatus } from "../utils/helper.js";
import archiver from "archiver";
import stream from "stream";
const s3Service = new S3Service();
const redisService = new RedisService();
const clickhouseService = new ClickHouseService();

const generatePresignedURLOnUploadStart = asyncHandler(
  async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      throw new ApiError(400, "No files uploaded.");
    }
    const { video } = req.files;
    if (!video) {
      throw new ApiError(400, "Specific field name required, (video)");
    }

    // allowing only mp4 type
    if (video.mimetype !== "video/mp4") {
      throw new ApiError(400, "Only mp4 files are allowed");
    }

    // restricting to 100 MB only
    const fileSizeInMB = video.size / (1024 * 1024);
    if (parseInt(fileSizeInMB) > 100) {
      throw new ApiError(400, "File size should be less than 100MB");
    }

    const params = {
      Bucket: process.env.TEMP_BUCKET_NAME,
      Key: video.name,
      ContentType: video.mimetype,
    };

    // check in redis if the file key already exists
    const exists = await redisService.isKeyExist(video.name);
    if (exists) {
      throw new ApiError(400, "File already exists");
    }

    // generate presigned url to upload this video into S3 temporary Bucket
    const presignedUrl = await s3Service.generatePresignedURL(params);

    res.json({ success: true, url: presignedUrl });
  }
);

const mapFileWithMetaDataInRedis = async (videoFileName, parmas) => {
  await redisService.mapFileNameWithTranscodeId(
    videoFileName,
    JSON.stringify(parmas)
  );
};

const uploadNewVideoOnSuccess = asyncHandler(async (req, res, next) => {
  const { videoFileName } = req.body;

  if (!videoFileName) {
    throw new ApiError(400, "Video file name is required");
  }

  const video_path = `${process.env.BASE_TEMP_BUCKET_ACCESS_URL}/${videoFileName}`;

  // calculating video duration
  const duration = await getVideoDurationInSeconds(video_path);
  if (!duration) {
    throw new ApiError(400, "Video file is not valid");
  }

  const addedVideo = await addVideoMetaDataInDB({
    video_file_name: videoFileName,
    video_duration: duration,
    transcode_id: uuidV4(),
  });
  await saveVideoInDB(addedVideo);

  // add this file in queue as soon as it uploads on DB
  await redisService.pushS3TempUploadEvents(videoFileName);

  // add key value pair of fileName , transcodeId and userId in redis
  const parmas = {
    transcode_id: addedVideo.transcode_id,
    user_id: req.user.id,
    container_running: false,
  };

  // map fileKey with transcode_id, user_id and container status in redis
  mapFileWithMetaDataInRedis(videoFileName, parmas);

  res.json({ success: true, video: addedVideo });
});

const getVideosFromQueueAndProcess = asyncHandler(async (req, res, next) => {
  const occupiedSlots = await redisService.getOccupiedSlots();

  // if all slots are occupied, We have limit of 5 slots
  if (parseInt(occupiedSlots) === 5) {
    throw new ApiError(400, "No available slots, please try after sometime");
  }

  // occupied slots are not present or initiating occupied slots
  if (parseInt(occupiedSlots) === -1) {
    await redisService.setOccupiedSlots(0);
  }

  // receive videos from queue
  const videosMetaData = await redisService.getS3UploadEvents(
    parseInt(occupiedSlots)
  );

  if (videosMetaData && videosMetaData.length > 0) {
    for (const message of videosMetaData) {
      // get fileMetaData from fileKey from redis
      const getFileMapping = await redisService.getValueForKey(message);
      const parsedValue = JSON.parse(getFileMapping);
      console.log("Message received:", message);

      // if container is not running then only start new container
      if (!parsedValue.container_running) {
        new ContainerService().runContainer(
          `${message}__${Date.now()}`,
          message
        );
      }

      // change container status for videoFile in redis
      mapFileWithMetaDataInRedis(message, {
        ...parsedValue,
        container_running: true,
      });
    }

    // set number of slots in occupied slots key in redis
    await redisService.setOccupiedSlots(videosMetaData.length);

    res.json({ success: true, videos_count: videosMetaData.length });
  } else {
    res.json({ success: true, videos_count: 0 });
  }
});

const getAllVideosFromDB = asyncHandler(async (req, res, next) => {
  const videos = await getAllVideos();
  return res.json({ success: true, videos, length: videos.length });
});

const getMasterM3U8Url = asyncHandler(async (req, res, next) => {
  const { transcodeId } = req.params;
  const requestedUserId = req.user._id;
  const url = `${process.env.OUTPUT_BUCKET_ACCESS_URL}/${requestedUserId}/${transcodeId}/master.m3u8`;
  return res.json({ success: true, url });
});

const retrieveTranscodeLogs = asyncHandler(async (req, res, next) => {
  const { transcodeId } = req.params;
  if (!transcodeId) {
    throw new ApiError(400, "Please provide transcode id");
  }
  const logs = await clickhouseService.retrieveLogs(transcodeId);
  const video = await getVideoByTranscodeId(transcodeId);
  const logsData = logs.hasOwnProperty("data") ? logs.data : [];
  const currentStatus = checkBuildStatus(logsData);
  if (video && video.length) {
    const prevStatus = video[0].status;
    // update new deployment status to DB if current and previous status are not equal
    if (currentStatus !== prevStatus) {
      await updateVideoStatus(prevStatus, currentStatus, video);
    }
  }
  return res.json({
    success: true,
    logs: logsData,
    current_status: currentStatus,
  });
});

const downloadVideo = asyncHandler(async (req, res, next) => {
  const { transcodeId } = req.params;
  const { videoKey } = req.body;
  if (!videoKey) {
    throw new ApiError(400, "Please provide video key");
  }
  if (!transcodeId) {
    throw new ApiError(400, "Please provide transcode id");
  }
  const trimmedVideoKey = videoKey.split(".").join("__");
  const requestedUserId = req.user._id;
  const outputFolder = `outputs/${requestedUserId}/${transcodeId}`;
  const listParams = {
    Bucket: process.env.OUTPUT_BUCKET_NAME,
    Prefix: outputFolder,
  };
  const listedObjects = await s3Service.getListObjects(listParams);
  // Create a zip archive
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Set the compression level
  });
  res.attachment(`${trimmedVideoKey}.zip`);
  res.setHeader("Content-Type", "application/zip");
  archive.pipe(res);
  // For each object in the listed objects, add it to the archive
  for (const obj of listedObjects.Contents) {
    const getParams = {
      Bucket: process.env.OUTPUT_BUCKET_NAME,
      Key: obj.Key,
    };
    const { Body } = await s3Service.getBodyObjects(getParams);
    const streamBody =
      Body instanceof stream.Readable ? Body : stream.Readable.from(Body);
    // Append each file to the archive with its original name
    const fileName = obj.Key.replace(outputFolder, "");
    archive.append(streamBody, { name: fileName });
  }
  // Finalize the archive (this is when the data is sent)
  await archive.finalize();
});


const deleteVideo = asyncHandler(async (req, res, next) => {
  const { transcodeId } = req.params;
  const userId = req.user._id;
  const outputFolder = `outputs/${userId}/${transcodeId}`;
  await s3Service.deleteTranscode(outputFolder);
  await deleteVideoFromDB(transcodeId);
  return res.json({ success: true, message: "Video Deleted." });
});


export {
  uploadNewVideoOnSuccess,
  generatePresignedURLOnUploadStart,
  getVideosFromQueueAndProcess,
  getAllVideosFromDB,
  retrieveTranscodeLogs,
  getMasterM3U8Url,
  downloadVideo,
  deleteVideo,
};
