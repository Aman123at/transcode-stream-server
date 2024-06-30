import mongoose, { Schema } from "mongoose";
const videoSchema = new Schema(
  {
    transcode_id: {
      type: String,
    },
    owner:{
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    video_duration:{
      type: Number,
    },
    video_file_name: {
      type: String,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    status:{
      type: String,
      default: 'queued',
    }
  },
  { timestamps: true }
);

export const Video = mongoose.model("Video", videoSchema);