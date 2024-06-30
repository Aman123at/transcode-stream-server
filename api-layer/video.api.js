import {Router} from 'express';
import { deleteVideo, downloadVideo, generatePresignedURLOnUploadStart, getAllVideosFromDB, getMasterM3U8Url, getVideosFromQueueAndProcess, retrieveTranscodeLogs, uploadNewVideoOnSuccess } from '../service-layer/video.service.js';
import { verifyJWT } from '../middlewares/auth.middlewares.js';
const router = Router();
// Unsecured route
router.route("/upload-start").post(verifyJWT,generatePresignedURLOnUploadStart);
router.route("/upload-success").post(verifyJWT,uploadNewVideoOnSuccess);
router.route("/poll-queue").get(verifyJWT,getVideosFromQueueAndProcess);
router.route("/get-all").get(verifyJWT,getAllVideosFromDB);
router.route("/logs/:transcodeId").get(verifyJWT,retrieveTranscodeLogs);
router.route("/masterURL/:transcodeId").get(verifyJWT,getMasterM3U8Url);
router.route("/download/:transcodeId").post(verifyJWT,downloadVideo);
router.route("/delete/:transcodeId").delete(verifyJWT,deleteVideo);

export default router;