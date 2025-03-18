import { Video } from "../models/video.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asynchandler } from "../utils/async.handler.js";
import { User } from "../models/user.model.js";
import {
  validateMongoDB_ID,
  cheackIdExistence,
  isStrictValidateId,
} from "../utils/validateId.js";
import {
  getPublicId,
  uploadOnCloudinary,
  updateOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudnary.js";

const getAllVideos = asynchandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asynchandler(async (req, res) => {
  const { title, description, thumbnail, videoFile } = req.body;

  // ye extension ka array hai jisko hum further validate karenge
  const videoExtensionsType = ["video/mp4", "video/avi", "video/mkv"];
  const imageExtensionType = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/tiff",
  ];

  // yaha se humne files ka extension extract kar liya first element se array ke using multer (MIME TYPE)
  const VideoExtension = req.files?.videoFile?.[0]?.mimetype;
  const thumbnailExtension = req.files?.thumbnail?.[0]?.mimetype;

  console.log("VideoExtension", VideoExtension);
  console.log("thumbnailExtension", thumbnailExtension);

  if (!videoExtensionsType.includes(VideoExtension))
    throw new apiError(400, "Invalid video type");
  if (!imageExtensionType.includes(thumbnailExtension))
    throw new apiError(400, "Invalid thumbnail type");

  // title ko validate kiya
  console.log("title", title);
  if (!title.toString()) throw new apiError(402, "Invalid title");

  // description ko validate kiya
  if (!description.toString()) throw new apiError(401, "Invalid description");
  console.log("descriptionValidate", typeof description);

  if (description.length >= 100 || description.length <= 10)
    throw new apiError(
      402,
      "Description should be contain more then 10 characters or less then 100 characters"
    );

  // clodinary pe file uploading ke liye multer se file path liya for storing it in local server then upload on clodinary
  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailFileLocalPath = req.files?.thumbnail[0]?.path;
  // console.log(videoFileLocalPath);
  // console.log(thumbnailFileLocalPath);

  const uploadedVideoFile = await uploadOnCloudinary(videoFileLocalPath);
  const uploadedThumbna1il = await uploadOnCloudinary(thumbnailFileLocalPath);
  // thumbnail aur video dono ko validate kiya
  if (!(uploadedVideoFile || uploadedThumbna1il))
    throw new apiError(401, "Video or thumbanil is required");

  // video naam ka document create kiya aur db me store kar diya
  const video = await Video.create({
    videoFile: uploadedVideoFile.secure_url,
    thumbnail: uploadedThumbna1il.secure_url,
    title: title,
    discription: description,
    duration: uploadedVideoFile.duration,
    owner: req.user?._id,
  });

  // document find karke id ke base pe usko as response send kiya
  const confirmCreateVideo = await Video.findById(video._id).populate({
    path: "owner",
    select: "username email avatar",
  });

  if (!confirmCreateVideo)
    throw new apiError(500, "Something went wrong while publishing video");
  // req object ke andar video bhi daal diya jese auth.middlewares me user dala tha req ke andar for further usage
  req.video = confirmCreateVideo;

  return res
    .status(200)
    .json(
      new apiResponse(200, confirmCreateVideo, "Video Upload Successfully..!")
    );
});

const getVideoById = asynchandler(async (req, res) => {
  const { videoId } = req.params;

  isStrictValidateId(videoId);
  validateMongoDB_ID(videoId);
  await cheackIdExistence(videoId, Video);

  // yaha humne req.params me se humne videoId extract kr liya jo dynamic route h or ek route variable bhi

  const findedVideo = await Video.findOne({
    // yaha humne findOne ka use krte hue _id (jo existing video id h) or videoId (jo postman me url me diya h)
    // inn dono ko match kiya, then reponse send kiya
    _id: videoId,
  }).populate([
    { path: "owner", select: "username email avatar" },
    {
      path: "comments",
      select: "comment owner",
      populate: {
        path: "owner",
        select: "username avatar",
      },
    },
    {
      path: "like",
      select: "like owner",
      populate: {
        path: "owner",
        select: "username avatar",
      },
    },
  ]);

  console.log(`findedVideo: ${findedVideo}`);

  if (!findedVideo) throw new apiError(404, "Video Not Found");

  return res.status(200).json(new apiResponse(200, findedVideo, "Video Found"));
});

const updateVideo = asynchandler(async (req, res) => {
  const { videoId } = req.params;

  isStrictValidateId(videoId);
  validateMongoDB_ID(videoId);
  await cheackIdExistence(videoId, Video);

  const { video, thumbnail, title, description } = req.body;

  const videoFromDB = await Video.findOne({
    _id: videoId,
  });

  if (!videoFromDB) throw new apiError(404, "Video not found");
  console.log(videoFromDB);

  const videoExtensionsType = ["video/mp4", "video/avi", "video/mkv"];
  const imageExtensionType = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/tiff",
  ];

  const VideoExtension = req.files?.videoFile?.[0]?.mimetype;
  const thumbnailExtension = req.files?.thumbnail?.[0]?.mimetype;

  if (!videoExtensionsType.includes(VideoExtension))
    throw new apiError(400, "Invalid Video");
  if (!imageExtensionType.includes(thumbnailExtension))
    throw new apiError(400, "Invalid thumbnail");

  if (!title.toString() || title.length <= 8 || title.length >= 25)
    throw new apiError(402, "Invalid Title");

  // description ko validate kiya
  if (
    !description.toString() ||
    description.length >= 100 ||
    description.length <= 10
  )
    throw new apiError(401, "Invalid Description");
  console.log("descriptionValidate", typeof description);

  const videoUrl = videoFromDB.videoFile;
  const videoPublicId = getPublicId(videoUrl);

  const thumbanilUrl = videoFromDB.thumbnail;
  const thumbanilPublicId = getPublicId(thumbanilUrl);

  const updatedVideoFile = req.files?.videoFile?.[0]?.path
    ? await updateOnCloudinary(req.files.videoFile[0].path, videoPublicId)
    : null;

  const updatedThumbnail = req.files?.thumbnail?.[0]?.path
    ? await updateOnCloudinary(req.files.thumbnail[0].path, thumbanilPublicId)
    : null;

  if (!(updatedVideoFile || updatedThumbnail))
    throw new apiError(401, "Video or thumbanil is required");

  const updateAllDetailsInDB = await Video.findByIdAndUpdate(
    videoFromDB?._id,
    {
      $set: {
        videoFile: updatedVideoFile?.secure_url,
        thumbnail: updatedThumbnail?.secure_url,
        discription: description,
        title: title,
        duration: updatedVideoFile?.duration,
      },
    },
    {
      new: true,
    }
  );
  if (!updateAllDetailsInDB)
    throw new apiError(500, "Server error, Please try again");

  return res
    .status(200)
    .json(
      new apiResponse(200, updateAllDetailsInDB, "Video Update Successfully")
    );
});

const deleteVideo = asynchandler(async (req, res) => {
  const { videoId } = req.params;
  isStrictValidateId(videoId);
  validateMongoDB_ID(videoId);
  await cheackIdExistence(videoId, Video);

  const findVideoById = await Video.findOne({
    _id: videoId,
  });

  if (!findVideoById) throw new apiError(400, "Record not found");
  const videoUrl = findVideoById.videoFile;

  const videoPublicId = getPublicId(videoUrl);

  const deletedVideoFromCloudinary = await deleteFromCloudinary(videoPublicId);

  if (!deletedVideoFromCloudinary)
    throw new apiError(401, "Task fail, video couldn't be deleted");

  const deletedVideoStatus = await Video.deleteOne({ _id: videoId });

  if (deletedVideoStatus.deletedCount === 0)
    throw new apiError(401, "Task fail, video couldn't be deleted");

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Video Deleted Successfully"));
});

const togglePublishStatus = asynchandler(async (req, res) => {
  const { videoId } = req.params;

  isStrictValidateId(videoId);
  validateMongoDB_ID(videoId);
  await cheackIdExistence(videoId, Video);

  const videoFromDB = await Video.findOne({
    _id: videoId,
  });

  if (!videoFromDB) throw new apiError(401, "Video not found");

  if (videoFromDB.isPublished === true) {
    videoFromDB.isPublished = false;
  } else {
    videoFromDB.isPublished = true;
  }

  const toggleVideoStatusFromDB = await Video.findByIdAndUpdate(
    videoFromDB?._id,
    {
      $set: {
        isPublished: videoFromDB.isPublished,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        toggleVideoStatusFromDB,
        "Video publish status toggled successfully"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
