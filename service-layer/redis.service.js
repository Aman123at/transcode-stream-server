import { Redis } from "ioredis";
import { promisify } from "util";
class RedisService {
  constructor() {
    this.redisClient = new Redis({
      port: process.env.REDIS_CONN_PORT,
      host: process.env.REDIS_HOST_URL,
      username: process.env.REDIS_CONN_USERNAME,
      password: process.env.REDIS_CONN_PASSWORD,
    });
  }
  async isRedisClientAvailable() {
    try {
      const response = await this.redisClient.ping();
      return response === "PONG";
    } catch (error) {
      return false;
    }
  }

  async pushS3TempUploadEvents(event) {
    try {
      await this.redisClient.lpush(process.env.REDIS_QUEUE_NAME, event);
    } catch (error) {
      console.log("Unable to push event into redis");
    }
  }

  async getS3UploadEvents(occupiedSlots) {
    const availableSlots = 5 - occupiedSlots;
    const lrangeAsync = promisify(this.redisClient.lrange).bind(
      this.redisClient
    );
    try {
      const messages = await lrangeAsync(
        process.env.REDIS_QUEUE_NAME,
        -availableSlots,
        -1
      );
      return messages;
    } catch (error) {
      console.log("Not able to get upload events.", error);
      return [];
    }
  }

  async getOccupiedSlots() {
    try {
      const slots = await this.redisClient.get("occupiedSlots");
      return slots;
    } catch (error) {
      return -1;
    }
  }
  async setOccupiedSlots(slot) {
    await this.redisClient.set("occupiedSlots", slot);
  }

  async mapFileNameWithTranscodeId(fileName, transcodeId) {
    await this.redisClient.set(fileName, transcodeId);
  }

  async isKeyExist(key) {
    const exists = await this.redisClient.exists(key);
    return exists === 1;
  }

  async getValueForKey(key) {
    const value = await this.redisClient.get(key);
    return value;
  }
}
export { RedisService };
