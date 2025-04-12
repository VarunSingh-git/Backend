import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
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

  const existedLikes = await Like.findOne({
    video: videoId,
    owner: req.user?._id,
  });

  if (existedLikes) {
    const existedLikes_id = existedLikes?._id;
    await Like.findByIdAndDelete(existedLikes_id);

    const unlikeVideoFromVideoModel = await Video.findByIdAndUpdate(videoId, {
      $pull: {
        like: existedLikes_id,
      },
    });
    if (!unlikeVideoFromVideoModel)
      throw new apiError(400, "Unlike couldn't completed");
    return res.status(200).json(new apiResponse(200, {}, "Unlike success"));
  } else {
    const newLike = await Like.create({
      video: videoId,
      owner: req.user?._id,
    });
    await Video.findByIdAndUpdate(
      videoId,
      {
        $push: {
          like: newLike?._id,
        },
      },
      { new: true }
    );

    const confirmLikes = await newLike.populate([
      {
        path: "video",
        select: "owner videoFile thumbnail comments duration",
        populate: {
          path: "owner",
          select: "username avatar",
        },
      },
      {
        path: "owner",
        select: "username avatar",
      },
    ]);
    console.log(`confirmLikes: ${confirmLikes}`);
    if (!confirmLikes) throw new apiError(400, "Like couldn't completed");
    return res
      .status(200)
      .json(new apiResponse(200, confirmLikes, "Like success"));
  }
});

const toggleCommentLike = asynchandler(async (req, res) => {
  const { commentId } = req.params;
  isStrictValidateId(commentId);
  validateMongoDB_ID(commentId);
  await cheackIdExistence(commentId, Comment);

  const likedComment = await Like.findOne({
    comment: commentId,
    owner: req.user?._id,
  });
  console.log(`likedComment: ${likedComment}`);
  if (likedComment) {
    const like_id = likedComment?._id;
    await Like.findByIdAndDelete(like_id);

    const unlikeComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $pull: { like: like_id },
      },
      { new: true }
    );
    console.log(`unlikeComment: ${unlikeComment}`);
    if (!unlikeComment) throw new apiError(401, "Couldn't unlike..!");

    return res.status(200).json(new apiResponse(200, {}, "Unlike Success"));
  } else {
    const like = await Like.create({
      comment: commentId,
      owner: req.user?._id,
    });
    const pushedCommentLikes = await Comment.findByIdAndUpdate(
      commentId,
      {
        $push: {
          like: like?._id,
        },
      },
      {
        new: true,
      }
    );
    console.log(`pushedCommentLikes, ${pushedCommentLikes}`);

    const confirmCommentLikes = await like.populate([
      { path: "owner", select: "username avatar" },
      {
        path: "comment",
        select: "comment owner videoFile",
        populate: {
          path: "owner",
          select: "username avatar",
        },
      },
    ]);
    // const
    if (!confirmCommentLikes) throw new apiError(401, "Couldn't like");
    return res
      .status(200)
      .json(new apiResponse(200, confirmCommentLikes, "Success"));
  }
});

const toggleTweetLike = asynchandler(async (req, res) => {
  const { tweetId } = req.params;

  isStrictValidateId(tweetId),
    validateMongoDB_ID(tweetId),
    await cheackIdExistence(tweetId, Tweet);

  const likedTweet = await Like.findOne({
    tweet: tweetId,
    owner: req.user?._id,
  });
  if (likedTweet) {
    const likedTweet_id = likedTweet?._id;
    await Like.findByIdAndDelete(likedTweet_id);

    const tweetUnlike = await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $pull: {
          like: likedTweet_id,
        },
      },
      {
        new: true,
      }
    );
    if (!tweetUnlike) throw new apiError(400, "Couldn't unlike...!");
    return res.status(200).json(new apiResponse(200, {}, "Unlike Success"));
  } else {
    const like = await Like.create({
      tweet: tweetId,
      owner: req.user?._id,
    });
    await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $push: {
          like: like?._id,
        },
      },
      {
        new: true,
      }
    );
    const populatedLike = await like.populate([
      {
        path: "owner", // ye vo owner h jisne like kiya h, na ki jisne tweet create kiya h.
        select: "username avatar",
      },
      {
        path: "tweet",
        select: "owner content createdAt updatedAt like",
        populate: {
          path: "owner", // ye tweet ka owner h jisne tweet create kiya
          select: "username avatar",
        },
      },
    ]);
    return res
      .status(200)
      .json(new apiResponse(200, populatedLike, "Like Success"));
  }
});

const getLikedVideos = asynchandler(async (req, res) => {
  const findedVideos = await Video.find({
    like: {
      // returned array me prasent like array h usme filtration ki h.
      $exists: true, // if like array exists or no.
      $ne: [], // or like array shouldn't be equal to an empty array.
    }, // inn sb filtration ke base p further populate query fire hogi.
  }).populate([
    {
      path: "like",
      select: "owner",
      populate: {
        path: "owner",
        select: "username avatar _id",
      },
    },
    {
      path: "owner",
      select: "username avatar",
      sort: {
        createdAt: -1,
      },
    },
  ]);
  // console.log(findedVideos);
  const likeCount = findedVideos.map(
    (likedVideosCount) =>
      `${likedVideosCount?.owner.username} has ${likedVideosCount?.like.length} likes on ${likedVideosCount?.videoFile}`
  );

  return res
    .status(200)
    .json(
      new apiResponse(200, { findedVideos, likeCount }, "Here's your data..")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
