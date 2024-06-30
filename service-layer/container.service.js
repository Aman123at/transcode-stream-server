import {exec} from 'child_process'
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs"
import { getECSClient, getECSRunTaskCommand } from '../utils/helper.js'
class ContainerService{
    async runContainer(identityName,fileKey){
        const envMode = process.env.NODE_ENV
        if(envMode==='development'){
            const executionCommand = `cd ../transcoder-engine && \
                docker build -t ${identityName.toLowerCase()} . && docker run -d \
                -e KAFKA_BROKER_URL=${process.env.KAFKA_BROKER_URL} \
                -e KAFKA_USERNAME=${process.env.KAFKA_USERNAME} \
                -e KAFKA_PASSWORD=${process.env.KAFKA_PASSWORD} \
                -e KAFKA_HOST_URL=${process.env.KAFKA_HOST_URL} \
                -e REDIS_HOST=${process.env.REDIS_HOST_URL} \
                -e REDIS_PORT=${process.env.REDIS_CONN_PORT} \
                -e REDIS_USERNAME=${process.env.REDIS_CONN_USERNAME} \
                -e REDIS_PASSWORD=${process.env.REDIS_CONN_PASSWORD} \
                -e VIDEO_INPUT_URL=${process.env.BASE_TEMP_BUCKET_ACCESS_URL+"/"+fileKey} \
                -e TEMP_BUCKET_NAME=${process.env.TEMP_BUCKET_NAME} \
                -e OUTPUT_BUCKET_NAME=${process.env.OUTPUT_BUCKET_NAME} \
                -e FILE_KEY=${fileKey} \
                -e REDIS_QUEUE_NAME=${process.env.REDIS_QUEUE_NAME} \
                -e AWS_S_THREE_ACCESSKEYID=${process.env.AWS_S_THREE_ACCESSKEYID} \
                -e AWS_S_THREE_SECRETACCESSKEY=${process.env.AWS_S_THREE_SECRETACCESSKEY} \
                ${identityName.toLowerCase()}
                `
            // console.log("VIDEO URL>>",process.env.BASE_TEMP_BUCKET_ACCESS_URL+"/"+fileKey)
            const proc = exec(executionCommand)
            // console.log(proc)
            proc.stdout.on('error', async function (data) {
                console.log('Docker Container Error', data.toString())
            })
            proc.stdout.on('data', async function (data) {
                console.log('Docker stdout: ' + data.toString());
            })
            proc.on('close', async function () {
                console.log('Docker Process Closed')
            })
        }else{
            //production
            const ecsClient = getECSClient()
            const command = getECSRunTaskCommand(fileKey)
            console.log("Running docker ECS ")
            await ecsClient.send(command)
        }
    }
}
export {ContainerService}