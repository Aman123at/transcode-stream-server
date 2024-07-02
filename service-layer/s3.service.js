import {
  PutObjectCommand,
  S3Client,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
class S3Service {
  constructor() {
    this.s3Client = new S3Client({
      region: "ap-south-1",
      credentials: {
        accessKeyId: process.env.AWS_S_THREE_ACCESSKEYID,
        secretAccessKey: process.env.AWS_S_THREE_SECRETACCESSKEY,
      },
    });
  }
  getClient() {
    return this.s3Client;
  }
  generatePutObjectCommand(payload) {
    return new PutObjectCommand(payload);
  }

  removeFileFromTempBucketCommand() {
    const params = {
      Bucket: process.env.TEMP_BUCKET_NAME,
      Key: process.env.FILE_KEY_TO_REMOVE,
    };
    const command = new DeleteObjectCommand(params);
    return command;
  }

  async generatePresignedURL(params) {
    const command = new PutObjectCommand(params);
    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: process.env.PRESIGNED_URL_EXPIRY,
    });
    return url;
  }

  async getListObjects(params) {
    const command = new ListObjectsV2Command(params);
    const data = await this.s3Client.send(command);
    return data;
  }

  async getBodyObjects(params) {
    const command = new GetObjectCommand(params);
    const data = await this.s3Client.send(command);
    return data;
  }

  async executeCommand(command) {
    await this.s3Client.send(command);
  }

  async deleteTranscode(folderPath) {
    // List all objects in the transcode ID folder
    const listParams = {
      Bucket: process.env.OUTPUT_BUCKET_NAME,
      Prefix: folderPath,
    };
    const listedObjects = await this.s3Client.send(
      new ListObjectsV2Command(listParams)
    );
    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.log({ error: "No files found in the specified folder." });
    }

    // Delete each listed object
    const deleteParams = {
      Bucket: process.env.OUTPUT_BUCKET_NAME,
      Delete: {
        Objects: listedObjects.Contents.map((obj) => ({ Key: obj.Key })),
        Quiet: false,
      },
    };
    await this.s3Client.send(new DeleteObjectsCommand(deleteParams));
  }
}

export { S3Service };
