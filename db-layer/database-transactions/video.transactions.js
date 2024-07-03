import { Video } from "../models/video.models.js";

const saveVideoInDB = async (video)=>{
    await video.save({ validateBeforeSave: false });
}
const addVideoMetaDataInDB = async(payload)=>{
    return await Video.create(payload)
}

const getAllVideos = async (userId) =>{
    return await Video.find({owner:userId});
}
const getVideoByTranscodeId = async (transcode_id) =>{
    return await Video.find({transcode_id});
}

const updateVideoStatusInDB = async (video_id,status)=>{
    return await Video.updateOne(
        { _id: video_id },
        { status }
    );
}
const deleteVideoFromDB = async (transcode_id)=>{
    return await Video.deleteOne(
        { transcode_id },
    );
}

export {
    saveVideoInDB,
    addVideoMetaDataInDB,
    getAllVideos,
    getVideoByTranscodeId,
    updateVideoStatusInDB,
    deleteVideoFromDB
}