import mongoose, { get, isValidObjectId } from "mongoose";
import { PlayList } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";
import {
  isStrictValidateId,
  validateMongoDB_ID,
  cheackIdExistence,
} from "../utils/validateId.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asynchandler } from "../utils/async.handler.js";
import { Video } from "../models/video.model.js";
import { populate } from "dotenv";

const createPlaylist = asynchandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description)
    throw new apiError(401, "Name or description can't be empty");

  if (name.length <= 5 || description.length <= 5)
    throw new apiError(401, "Invalid name or description");

  const createdPlaylist = await PlayList.create({
    name: name,
    description: description,
    videos: [],
    owner: req.user?._id,
  });

  if (!createPlaylist) throw new apiError(500, "Playlist creation failed..!");
  return res
    .status(200)
    .json(new apiResponse(200, createdPlaylist, "Playlist created"));
});

const getUserPlaylists = asynchandler(async (req, res) => {
  const { userId } = req.params;

  isStrictValidateId(userId);
  validateMongoDB_ID(userId);
  await cheackIdExistence(userId, User);

  const userPlaylists = await PlayList.find({ owner: userId });
  if (!userPlaylists) throw new apiError(404, "Playlist not found");

  // console.log(userPlaylists);
  const playlistLength = userPlaylists.length;

  return res
    .status(200)
    .json(
      new apiResponse(200, { userPlaylists, playlistLength }, "Playlist found")
    );
});

const getPlaylistById = asynchandler(async (req, res) => {
  const { playlistId } = req.params;

  isStrictValidateId(playlistId);
  validateMongoDB_ID(playlistId);
  await cheackIdExistence(playlistId, PlayList);

  const playlist = await PlayList.findById(playlistId);
  if (!playlist) throw new apiError(404, "Playlist not found");

  const user = playlist.owner.toString();
  if (user !== req.user?._id.toString())
    throw new apiError(403, "Unauthentication action");

  return res.status(200).json(new apiResponse(200, playlist, "Data fetched"));
});

const addVideoToPlaylist = asynchandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  isStrictValidateId(playlistId);
  validateMongoDB_ID(playlistId);
  await cheackIdExistence(playlistId, PlayList);

  isStrictValidateId(videoId);
  validateMongoDB_ID(videoId);
  await cheackIdExistence(videoId, Video);

  const video = await Video.findById(videoId);

  if (video.isPublished === true) {

    const playlist = await PlayList.findById(playlistId);
    const user = playlist.owner._id.toString();

    if (user !== req.user?._id.toString())
      throw new apiError(403, "Unauthenticate task");

    if (!playlist || !video)
      throw new apiError(404, "Playlist or video not found");

    const cheackVideoExistence = playlist.videos.some(
      (existedVideoId) => existedVideoId.toString() === video._id.toString()
    );

    if (cheackVideoExistence) throw new apiError(400, "Video already added");

    playlist.videos.push(video._id);
    await playlist.save();

    const updatedPlaylist = await PlayList.findById(playlistId)
      .populate("owner", "username avatar _id")
      .populate(
        "videos",
        "videoFile thumbnail title discription duration owner comments like"
      );
    // const playlistVideoCount = ;
    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          { updatedPlaylist, playlistVideoCount: playlist.videos.length },
          "Video added successfully"
        )
      );
  } else {
    return res
      .status(400)
      .json(new apiError(400, "Unpublish video cannot be added"));
  }
});

const removeVideoFromPlaylist = asynchandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  isStrictValidateId(playlistId);
  validateMongoDB_ID(playlistId);
  await cheackIdExistence(playlistId, PlayList);

  isStrictValidateId(videoId);
  validateMongoDB_ID(videoId);
  await cheackIdExistence(videoId, Video);

  const findedPlaylist = await PlayList.findOne({ _id: playlistId });
  if (!findedPlaylist) throw new apiError(404, "Playlist not found");
  // console.log("findedPlaylist", findedPlaylist);

  const findedVideo = await Video.findOne({ _id: videoId });
  if (!findedVideo) throw new apiError(404, "Video not found");
  if (findedVideo.owner.toString() !== req.user?._id.toString())
    throw new apiError(403, "Unauthentication request");

  const isVideoPresentInPlaylist = findedPlaylist.videos.includes(
    findedVideo?._id
  );
  if (!isVideoPresentInPlaylist) throw new apiError(404, "Video unavailable");

  findedPlaylist.videos.pull(videoId);
  const successMessage = await findedPlaylist.save();
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        successMessage,
        "Video removed successfully from playlist"
      )
    );
});

const deletePlaylist = asynchandler(async (req, res) => {
  const { playlistId } = req.params;
  isStrictValidateId(playlistId);
  validateMongoDB_ID(playlistId);
  await cheackIdExistence(playlistId, PlayList);

  const isPlaylistExists = await PlayList.findById(playlistId);
  console.log(`1. isPlaylistExists: ${isPlaylistExists}`);
  if (isPlaylistExists.owner._id.toString() !== req.user?._id.toString())
    throw new apiError(403, "Unauthenticate request");
  if (!isPlaylistExists) throw new apiError(404, "Playlist not found");
  const AcknowlegementOfDeletedVideo = await PlayList.deleteOne({
    _id: new mongoose.Types.ObjectId(playlistId),
  });

  if (AcknowlegementOfDeletedVideo.deletedCount === 0)
    throw new apiError(
      401,
      "Playlist can't removed due to some internal issue"
    );
  return res
    .status(200)
    .json(new apiResponse(200, {}, "Playlist deleted success"));
});

const updatePlaylist = asynchandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  isStrictValidateId(playlistId);
  validateMongoDB_ID(playlistId);
  await cheackIdExistence(playlistId, PlayList);

  if (!name || (!description && name.length))
    throw new apiError(404, "Name or description must have some value");

  if (name.length <= 5 || description.length <= 5)
    throw new apiError(401, "Name or description must be 5 character long");

  const getExistedPlaylist = await PlayList.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name: name,
        description: description,
      },
    },
    {
      new: true,
    }
  );
  if (!getExistedPlaylist) throw new apiError(404, "Playlist couldn't update");
  return res
    .status(200)
    .json(new apiResponse(200, getExistedPlaylist, "Playlist updated"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
