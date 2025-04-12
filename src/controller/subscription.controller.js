import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asynchandler } from "../utils/async.handler.js";
import {
  isStrictValidateId,
  validateMongoDB_ID,
  cheackIdExistence,
} from "../utils/validateId.js";

const toggleSubscription = asynchandler(async (req, res) => {
  const { channelId } = req.params;

  isStrictValidateId(channelId);
  validateMongoDB_ID(channelId);
  await cheackIdExistence(channelId, User);

  const isSubscribe = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  console.log(`isSubscribe: ${isSubscribe}`);
  if (!isSubscribe) {
    await Subscription.create({
      subscriber: req.user?._id,
      channel: channelId,
    });
    const finalData = await Subscription.find({ channel: channelId }).populate([
      {
        path: "subscriber",
        select: "username fullname avatar",
      },
      {
        path: "channel",
        select: "username fullname avatar",
      },
    ]);
    return res
      .status(200)
      .json(new apiResponse(200, finalData, "Channel Subscribed"));
  } else {
    await Subscription.deleteOne({
      _id: new mongoose.Types.ObjectId(isSubscribe?._id),
    });
    const finalData = await Subscription.find({ channel: channelId }).populate([
      {
        path: "subscriber",
        select: "username fullname avatar",
      },
      {
        path: "channel",
        select: "username fullname avatar",
      },
    ]);
    return res
      .status(200)
      .json(new apiResponse(200, finalData, "Channel Unsubscribed"));
  }
});

// controller to return subscriber list of a channel
// channle ke subscruber return krega
const getUserChannelSubscribers = asynchandler(async (req, res) => {
  const { channelId } = req.params;

  isStrictValidateId(channelId);
  validateMongoDB_ID(channelId);
  await cheackIdExistence(channelId, User);

  const data = await Subscription.aggregate([
    // humne phle $match use kia, match channelId pe kaam kr rha hai toh ve docs filter hoge jinme channel ki _id equal hogi channelI ke.
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    // ab jo document upar se filter hoke aaye h (jo channelId ke base pe filter hue h) unme ek subscriber field bhi h. toh hum uss subscriber field (jo lookup me lgya h) ka use krke user collection se data laa rhe h.
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "totalChannelSubscriber", // iska outpur as aary aayga so isko hum aage $ lagakar shuru krege
      },
    },
    // ye array ko object me convert krta h. taaki api se easily access ho ske.
    {
      $unwind: "$totalChannelSubscriber",
    },
    {
      $project: {
        _id: 1,
        fullname: "$totalChannelSubscriber.fullname",
        username: "$totalChannelSubscriber.username",
        avatar: "$totalChannelSubscriber.avatar",
      },
    },
  ]);
  return res
    .status(200)
    .json(new apiResponse(200, data, "Here's your subscriber"));
});

// controller to return channel list to which user has subscribed
// jo channle humne subscribe kiye h unn ko return krega
const getSubscribedChannels = asynchandler(async (req, res) => {
  const { subscriberId } = req.params;

  isStrictValidateId(subscriberId);
  validateMongoDB_ID(subscriberId);
  await cheackIdExistence(subscriberId, User);

  const data = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "totalSubscribedChannel",
      },
    },
    {
      $unwind: "$totalSubscribedChannel",
    },
    {
      $project: {
        _id: 1,
        fullname: "$totalSubscribedChannel.fullname",
        username: "$totalSubscribedChannel.username",
        avatar: "$totalSubscribedChannel.avatar",
      },
    },
  ]);
  return res.status(200).json(new apiResponse(200, data, "Here's your data"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
