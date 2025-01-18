import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js"
import { asynchandler } from "../utils/async.handler.js"
import { uploadOnCloudinary } from "../utils/cloudnary.js"


const getAllVideos = asynchandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asynchandler(async (req, res) => {
    const { title, description, thumbnail, videoFile } = req.body

    // ye extension ka array hai jisko hum further validate karenge
    const videoExtensionsType = ["video/mp4", "video/avi", "video/mkv"];
    const imageExtensionType = ['image/jpeg', 'image/png', 'image/jpg', 'image/tiff']

    // yaha se humne files ka extension extract kar liya first element se array ke using multer (MIME TYPE)
    const VideoExtension = req.files?.videoFile?.[0]?.mimetype
    const thumbnailExtension = req.files?.thumbnail?.[0]?.mimetype

    console.log('VideoExtension', VideoExtension)
    console.log('thumbnailExtension', thumbnailExtension)

    if (!videoExtensionsType.includes(VideoExtension)) throw new apiError(400, "Invalid Video Type")
    if (!imageExtensionType.includes(thumbnailExtension)) throw new apiError(400, "Invalid Thumbanail Type")

    // title ko validate kiya 
    console.log('title', title)
    if (!title) throw new apiError(402, "Title was not found")

    // description ko validate kiya 
    if (!description.toString()) throw new apiError(401, "Kindly give some description")
    console.log('descriptionValidate', typeof (description))

    if (description.length >= 100 || description.length <= 10) throw new apiError(402, "Description should be contain more then 10 characters or less then 100 characters")

    // clodinary pe file uploading ke liye multer se file path liya for storing it in local server then upload on clodinary 
    const videoFileLocalPath = req.files?.videoFile[0]?.path
    const thumbnailFileLocalPath = req.files?.thumbnail[0]?.path

    const uploadedVideoFile = await uploadOnCloudinary(videoFileLocalPath)
    const uploadedThumbna1il = await uploadOnCloudinary(thumbnailFileLocalPath)
    // thumbnail aur video dono ko validate kiya
    if (!(uploadedVideoFile || uploadedThumbna1il)) throw new apiError(401, "Video or thumbanil is required")

    // video naam ka document create kiya aur db me store kar diya
    const video = await Video.create({
        videoFile: uploadedVideoFile.secure_url,
        thumbnail: uploadedThumbna1il.secure_url,
        title,
        discription: description,
        duration: uploadedVideoFile.duration
    })

    // document find karke id ke base pe usko as response send kiya
    const confirmCreateVideo = await Video.findById(video._id)
    if (!confirmCreateVideo) throw new apiError(500, "Something went wrong while ")
    // req object ke andar video bhi daal diya jese auth.middlewares me user dala tha req ke andar for further usage
    req.video = confirmCreateVideo

    return res
        .status(200)
        .json(
            new apiResponse(200, confirmCreateVideo, "Video Upload Successfully..!")
        )
})

const getVideoById = asynchandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asynchandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asynchandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asynchandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
