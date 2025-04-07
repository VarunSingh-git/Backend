import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asynchandler } from "../utils/async.handler.js";

const toggleSubscription = asynchandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
});

// controller to return subscriber list of a channel
// channle ke subscruber return krega
const getUserChannelSubscribers = asynchandler(async (req, res) => {
  const { channelId } = req.params;
});

// controller to return channel list to which user has subscribed
// jo channle humne subscribe kiye h unn ko return krega
const getSubscribedChannels = asynchandler(async (req, res) => {
  const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
