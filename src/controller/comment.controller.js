import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asynchandler } from "../utils/async.handler.js";
import { Video } from "../models/video.model.js";
import {
  validateMongoDB_ID,
  cheackIdExistence,
  isStrictValidateId,
} from "../utils/validateId.js";

const getVideoComments = asynchandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query; 
});

const addComment = asynchandler(async (req, res) => {
  const { videoId } = req.params;
  const { comment } = req.body;

  isStrictValidateId(videoId);
  validateMongoDB_ID(videoId);
  await cheackIdExistence(videoId, Video);

  if (!comment) throw new apiError(401, "Comment can't be empty");
  const videoInfo = await Video.findById(videoId);
  console.log(`videoInfo: ${videoInfo}`);

  if (!req.user?._id.toString())
    throw new apiError(403, "Unauthenticate request!!");

  const newComment = await Comment.create({
    comment: comment,
    video: videoInfo?._id,
    owner: req.user?._id,
  });
  // console.log(`newComment: ${newComment}`);
  videoInfo.comments.push(newComment?._id);
  await videoInfo.save();
  console.log(`videoInfo: ${videoInfo}`);

  const confirmCreateComment = await Comment.findByIdAndUpdate(
    newComment?._id
  ).populate([
    {
      path: "video",
      select: "videoFile thumbnail title discription",
    },
    {
      path: "owner",
      select: "username avatar",
    },
    {
      path: "comment",
    },
  ]);
  console.log(`confirmCreateComment: ${confirmCreateComment}`);
  if (!confirmCreateComment)
    throw new apiError("500", "Comment couldn't create");
  return res
    .status(200)
    .json(new apiResponse(200, confirmCreateComment, "Comment added"));
});

const updateComment = asynchandler(async (req, res) => {
  const { commentId } = req.params;

  isStrictValidateId(commentId);
  validateMongoDB_ID(commentId);
  await cheackIdExistence(commentId, Comment);

  const { comment } = req.body;

  if (!comment) throw new apiError(401, "Comment can't be empty");
  const commentInfo = await Comment.findById(commentId);

  if (commentInfo.owner.toString() !== req.user?._id.toString())
    throw new apiError(403, "Unauthenticate request!!");

  if (!comment.trim()) throw new apiError(401, "Comment can't be empty");

  if (comment === commentInfo.comment)
    throw new apiError(401, "Comment updation failed!!");

  commentInfo.comment = comment.trim();
  await commentInfo.save();

  await commentInfo.populate([
    {
      path: "owner",
      select: "username avatar",
    },
    {
      path: "video",
      select: "videoFile title discription duration views",
    },
  ]);

  return res
    .status(200)
    .json(new apiResponse(200, commentInfo, "Comment updated"));
});

const deleteComment = asynchandler(async (req, res) => {
  const { commentId, videoId } = req.params;

  isStrictValidateId(commentId);
  validateMongoDB_ID(commentId);
  await cheackIdExistence(commentId, Comment);

  isStrictValidateId(videoId);
  validateMongoDB_ID(videoId);
  await cheackIdExistence(videoId, Video);

  const commentInfo = await Comment.findById(commentId);
  console.log(`commentInfo: ${commentInfo}`);
  const deletedComment = await Comment.deleteOne({ _id: commentId });
  const deletedCommentFromVideo = await Video.findByIdAndUpdate(videoId, {
    $pull: { comments: commentId },
  });
  if (
    deletedComment.deletedCount === 0 ||
    deletedComment.acknowledged === "false" ||
    !deletedCommentFromVideo
  )
    throw new apiError(401, "Deletion failed");

  return res.status(200).json(new apiResponse(200, {}, "Comment Deleted"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
