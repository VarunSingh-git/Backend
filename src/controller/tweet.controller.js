import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asynchandler } from "../utils/async.handler.js";

const createTweet = asynchandler(async (req, res) => {
  const { content } = req.body;
  console.log(req.body);
  if (!content) throw new apiError(400, "Tweet section cannot be empty");
  const tweet = content.toString();
  if (tweet.length <= 10 || tweet.length >= 200)
    throw new apiError(
      400,
      "Tweet should be contain less then 10 or more then 200 characters"
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
  // TODO: get user tweets
});

const updateTweet = asynchandler(async (req, res) => {
  //TODO: update tweet
});

const deleteTweet = asynchandler(async (req, res) => {
  //TODO: delete tweet
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
