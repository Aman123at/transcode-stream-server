// ecosystem.config.js
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default {
  apps: [
    {
      name: 'transcode-stream',
      script: './index.js', // Replace with the entry point of your application
      env: {
        KAFKA_BROKER_URL: process.env.KAFKA_BROKER_URL,
        KAFKA_HOST_URL: process.env.KAFKA_HOST_URL,
        KAFKA_USERNAME: process.env.KAFKA_USERNAME,
        KAFKA_PASSWORD: process.env.KAFKA_PASSWORD,
        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
        ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,
        MONGODB_URI: process.env.MONGODB_URI,
        MONGO_USER: process.env.MONGO_USER,
        MONGO_PASS: process.env.MONGO_PASS,
        DB_NAME: process.env.DB_NAME,
        TEMP_BUCKET_NAME: process.env.TEMP_BUCKET_NAME,
        PRESIGNED_URL_EXPIRY: process.env.PRESIGNED_URL_EXPIRY,
        AWS_S_THREE_ACCESSKEYID: process.env.AWS_S_THREE_ACCESSKEYID,
        AWS_S_THREE_SECRETACCESSKEY: process.env.AWS_S_THREE_SECRETACCESSKEY,
        REDIS_HOST_URL: process.env.REDIS_HOST_URL,
        REDIS_CONN_PORT: process.env.REDIS_CONN_PORT,
        REDIS_CONN_USERNAME: process.env.REDIS_CONN_USERNAME,
        REDIS_CONN_PASSWORD: process.env.REDIS_CONN_PASSWORD,
        NODE_ENV: process.env.NODE_ENV,
        BASE_TEMP_BUCKET_ACCESS_URL: process.env.BASE_TEMP_BUCKET_ACCESS_URL,
        OUTPUT_BUCKET_NAME: process.env.OUTPUT_BUCKET_NAME,
        OUTPUT_BUCKET_ACCESS_URL: process.env.OUTPUT_BUCKET_ACCESS_URL,
        REDIS_QUEUE_NAME: process.env.REDIS_QUEUE_NAME,
        CLICKHOUSE_URL: process.env.CLICKHOUSE_URL,
        CLICKHOUSE_USERNAME: process.env.CLICKHOUSE_USERNAME,
        CLICKHOUSE_PASSWORD: process.env.CLICKHOUSE_PASSWORD,
        ECS_CONTAINER_NAME: process.env.ECS_CONTAINER_NAME,
        TASK_SUBNETS: process.env.TASK_SUBNETS,
        ECS_CLUSTER_ARN: process.env.ECS_CLUSTER_ARN,
        ECS_TASK_ARN: process.env.ECS_TASK_ARN
      }
    }
  ]
};