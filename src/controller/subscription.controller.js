import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js"
import {asynchandler} from "../utils/async.handler.js"


const toggleSubscription = asynchandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asynchandler(async (req, res) => {
    const {channelId} = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asynchandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}