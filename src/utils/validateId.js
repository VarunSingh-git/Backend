import mongoose from "mongoose";
import { apiError } from "./apiError.js";
import { Video } from "../models/video.model.js";
import { asynchandler } from "./async.handler.js";

const isStrictValidateId = (mongoDB_id) => {
  if (typeof mongoDB_id !== "string" || mongoDB_id.length !== 24) {
    throw new apiError(400, "Invalid Id");
  }
  return;
};
const cheackIdExistence = async (mongoDB_id) => {
  const doesIdExist = await Video.findById(mongoDB_id);
  if (!doesIdExist) throw new apiError(400, "Video not found!");
};

const validateMongoDB_ID = (mongoDB_id) => {
  if (!mongoose.Types.ObjectId.isValid(mongoDB_id))
    throw new apiError("400", "Cannot Process this request");
  return;
};

export { validateMongoDB_ID, cheackIdExistence, isStrictValidateId };
