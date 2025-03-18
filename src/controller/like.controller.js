import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asynchandler } from "../utils/async.handler.js";
import {
  isStrictValidateId,
  validateMongoDB_ID,
  cheackIdExistence,
} from "../utils/validateId.js";

const toggleVideoLike = asynchandler(async (req, res) => {
  const { videoId } = req.params;

  isStrictValidateId(videoId);
  validateMongoDB_ID(videoId);
  await cheackIdExistence(videoId, Video);

  const videoExistence = await Video.findOne({ _id: videoId });
  if (!videoExistence) throw new apiError(404, "Video not found");
  console.log(`videoExistence, ${videoExistence}`);
  const existedLikes = await Like.findOne({
    video: videoId,
    owner: req.user?._id,
  });

  if (existedLikes) {
    await Like.findOneAndDelete({
      _id: existedLikes?._id,
      owner: req.user?._id,
    });
    const unlikeVideoFromVideoModel = await Video.findByIdAndUpdate(videoId, {
      $pull: {
        like: existedLikes?._id,
      },
    });
    console.log(`unlikeVideoFromVideoModel, ${unlikeVideoFromVideoModel}`);
    if (!unlikeVideoFromVideoModel)
      throw new apiError(400, "Unlike couldn't completed");
    return res.status(200).json(new apiResponse(200, {}, "Unlike success"));
  } else {
    const newLike = await Like.create({
      video: videoId,
      owner: req.user?._id,
    });
    videoExistence.like.push(newLike?._id);
    const like = await videoExistence.save();

    const confirmLikes = await Like.findById(newLike?._id).populate([
      {
        path: "video",
        select: "videoFile thumbnail comments duration",
      },
      {
        path: "owner",
        select: "username avatar",
      },
      
    ]);
    if (!confirmLikes) throw new apiError(400, "Like couldn't completed");
    return res.status(200).json(new apiResponse(200, confirmLikes, "Like success"));
  }
});

const toggleCommentLike = asynchandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
});

const toggleTweetLike = asynchandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

const getLikedVideos = asynchandler(async (req, res) => {
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
