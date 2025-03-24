import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import {
  isStrictValidateId,
  validateMongoDB_ID,
  cheackIdExistence,
} from "../utils/validateId.js";
import { asynchandler } from "../utils/async.handler.js";

const createTweet = asynchandler(async (req, res) => {
  const { content } = req.body;

  if (!content) throw new apiError(400, "Tweet section cannot be empty");
  const tweet = content.toString();
  if (tweet.length <= 5 || tweet.length >= 250)
    throw new apiError(
      400,
      "Tweet should be contain more then 5 or more less then 250 characters"
    );

  const tweetCreation = await Tweet.create({
    content: tweet,
    owner: req.user?._id,
  });

  const confirmationForTweetCreation = await Tweet.findById(
    tweetCreation?._id
  ).populate({ path: "owner", select: "username fullname avatar" });

  if (!confirmationForTweetCreation)
    throw new apiError("404", "Server internal error occur");

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        confirmationForTweetCreation,
        "Tweet Created Successfully"
      )
    );
});

const getUserTweets = asynchandler(async (req, res) => {
  const { userId } = req.params;

  isStrictValidateId(userId);
  validateMongoDB_ID(userId);
  await cheackIdExistence(userId, User);

  if (!userId) throw new apiError(404, "User not found");

  if (userId.toString() !== req.user?._id.toString())
    throw new apiError(403, "Unauthorized request");

  const userTweet = await Tweet.find({ owner: userId })
    .populate([
      { path: "owner", select: "username avatar -_id" },
      {
        path: "like",
        select: "owner tweet",
        populate: [
          { path: "owner", select: "username avatar" },
          { path: "tweet", select: "content" },
        ],
        // populate: { path: "tweet" },
      },
    ])
    .select("owner content updatedAt createdAt _id");
  const tweetLikedCount = userTweet[0]?.like.length;
  if (!userTweet[0]?.content) throw new apiError(404, "Tweet not found");

  return res
    .status(200)
    .json(new apiResponse(200, { userTweet, tweetLikedCount }, "Tweet found"));
});

const updateTweet = asynchandler(async (req, res) => {
  const { tweetId } = req.params;
  const { tweet } = req.body;

  isStrictValidateId(tweetId);
  validateMongoDB_ID(tweetId);
  await cheackIdExistence(tweetId, Tweet);

  if (!tweetId) throw new apiError(404, "Tweet not found");
  const userTweet = await Tweet.findById(tweetId);

  if (userTweet.owner.toString() !== req.user?._id.toString())
    throw new apiError(403, "Unauthorized request");

  if (!tweet) throw new apiError(400, "Tweet content cannot be empty");
  const tweetContent = tweet.toString();
  if (tweetContent <= 5 || tweetContent >= 250)
    throw new apiError(
      400,
      "Tweet should be contain more then 5 or more less then 250 characters"
    );

  if (userTweet.content == tweet)
    throw new apiError(301, "Tweet already updated");

  userTweet.content = tweet;
  await userTweet.save();

  return res
    .status(200)
    .json(new apiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asynchandler(async (req, res) => {
  const { tweetId } = req.params;

  isStrictValidateId(tweetId);
  validateMongoDB_ID(tweetId);
  await cheackIdExistence(tweetId, Tweet);

  if (!tweetId) throw new apiError(404, "Tweet not found");
  const userTweet = await Tweet.findById(tweetId);

  if (userTweet.owner.toString() !== req.user?._id.toString())
    throw new apiError(403, "Unauthorized request");

  const deletedTweet = await Tweet.deleteOne({ _id: tweetId });

  if (!deletedTweet) throw new apiError(500, "Tweet deletion failed..!");
  return res.status(200).json(new apiResponse(200, "Tweet Deleted"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
