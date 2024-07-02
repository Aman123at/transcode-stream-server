const PORT = process.env.PORT || 8200;
import connectDB from "./db-layer/connection.js";
import appServer from "./server.js";
import { RedisService } from "./service-layer/redis.service.js";
const redisService = new RedisService();
const initServer = async () => {
  appServer
    .listen(PORT, () => {
      console.log(`Server is listening to port ${PORT}`);
    })
    .on("error", (err) => {
      console.log(err);
      process.exit();
    });
};
connectDB()
  .then(() => {
    const isRedisAvailable = redisService.isRedisClientAvailable();
    if (isRedisAvailable) {
      console.log("\n☘️ Redis connected and available. \n");
      initServer();
    } else {
      console.log("Redis is not available");
    }
  })
  .catch((err) => {
    console.log("Mongo db connect error: ", err);
  });
