import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs"
import { updateVideoStatusInDB } from "../db-layer/database-transactions/video.transactions.js"

export const extractFileKeyFromQueueMessage = (messageBody)=> {
    let filekey = ""
    if(messageBody && messageBody.hasOwnProperty("Records") && messageBody.Records.length){
        const record = messageBody.Records[0]
        if(record && record.hasOwnProperty("s3") && record.s3.hasOwnProperty("object")){
            const object = record.s3.object
            filekey = object.key
        }
    }
    return filekey        
}


export const checkBuildStatus=(logs)=>{
    let status = ''
    for (let index = 0; index < logs.length; index++) {
        const log = logs[index];
        const logMsg = log.log
        if(status!=="in-progress" && logMsg.includes('Container Started...')){
            status = "in-progress"
        }
        if(status!=="active" && logMsg.includes('Done')){
            status = "active"
        }
        if(status!=="error" && logMsg.includes('error:')){
            status = "error"
        }
        
    }
    return status
}


export const updateVideoStatus = async (
    prevStatus,
    currentStatus,
    prevVideoData
  ) => {
    // check current build started and previous build queued then update status in DB to in-progress
    if (
      currentStatus === "in-progress" &&
      prevStatus === "queued"
    ) {
      await updateVideoStatusInDB(prevVideoData[0]._id,"in-progress")
    }
    // check current build active and previous build in-progress then update status in DB to active
    if (
      currentStatus === "active" &&
      (prevStatus === "in-progress" || "queued")
    ) {
      await updateVideoStatusInDB(prevVideoData[0]._id,"active")
    }
    // check current build error and previous build in-progress then update status in DB to error
    if (
      currentStatus === "error" &&
      prevStatus === "in-progress"
    ) {
      await updateVideoStatusInDB(prevVideoData[0]._id,"error")
    }
  };
  

  export const getECSClient = ()=>{
    return new ECSClient({
      region: 'ap-south-1',
      credentials: {
          accessKeyId: process.env.AWS_S_THREE_ACCESSKEYID,
          secretAccessKey: process.env.AWS_S_THREE_SECRETACCESSKEY
      }
  })
  }

  export const getECSRunTaskCommand = (fileKey) => {
    return new RunTaskCommand({
      cluster: process.env.ECS_CLUSTER_ARN,
      taskDefinition: process.env.ECS_TASK_ARN,
      launchType: 'FARGATE',
      count: 1,
      networkConfiguration: {
          awsvpcConfiguration: {
              assignPublicIp: 'ENABLED',
              subnets: process.env.TASK_SUBNETS.split(","),
          }
      },
      overrides: {
          containerOverrides: [
              {
                  name: process.env.ECS_CONTAINER_NAME,
                  environment: [
                      {name:'KAFKA_BROKER_URL',value:process.env.KAFKA_BROKER_URL},
                      {name:'KAFKA_HOST_URL',value:process.env.KAFKA_HOST_URL},
                      {name:'KAFKA_USERNAME',value:process.env.KAFKA_USERNAME},
                      {name:'KAFKA_PASSWORD',value:process.env.KAFKA_PASSWORD},
                      {name:'REDIS_HOST',value:process.env.REDIS_HOST},
                      {name:'REDIS_PORT',value:process.env.REDIS_PORT},
                      {name:'REDIS_USERNAME',value:process.env.REDIS_USERNAME},
                      {name:'REDIS_PASSWORD',value:process.env.REDIS_PASSWORD},
                      {name:'VIDEO_INPUT_URL',value:process.env.BASE_TEMP_BUCKET_ACCESS_URL+"/"+fileKey},
                      {name:'TEMP_BUCKET_NAME',value:process.env.TEMP_BUCKET_NAME},
                      {name:'OUTPUT_BUCKET_NAME',value:process.env.OUTPUT_BUCKET_NAME},
                      {name:'FILE_KEY',value:fileKey},
                      {name:'REDIS_QUEUE_NAME',value:process.env.REDIS_QUEUE_NAME},
                      {name:'AWS_S_THREE_ACCESSKEYID',value:process.env.AWS_S_THREE_ACCESSKEYID},
                      {name:'AWS_S_THREE_SECRETACCESSKEY',value:process.env.AWS_S_THREE_SECRETACCESSKEY},
                  ]
              }
          ]
      }
  })
  }