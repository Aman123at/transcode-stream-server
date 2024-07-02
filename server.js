import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorHandler } from "./middlewares/error.middlewares.js";
import userRouter from "./api-layer/user.api.js";
import videoRouter from "./api-layer/video.api.js";
import fileUpload from "express-fileupload";
import KafkaService from "./service-layer/kafka.service.js";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(fileUpload());
app.use(cookieParser());

const kafkaService = new KafkaService();
// kafka consumer initialized
kafkaService.initConsumer();

// demo api
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Transcodestream api" });
});

//api
app.use("/api/user", userRouter);
app.use("/api/video", videoRouter);

// error handler
app.use(errorHandler);

export default app;
