import { apiError } from "../utils/apiError.js";
import { asynchandler } from "../utils/async.handler.js";
import { apiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary, getPublicId, deleteFromCloudinary } from "../utils/cloudnary.js"
import { log } from "console"
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userid) => {
    try {
        const user = await User.findById(userid)
        const accessToken = await user.getAccessToken()
        const refreshToken = await user.getRefreshToken()

        user.refreshToken = refreshToken
        await user.save(
            {
                validateBeforeSave: false
            }
        )

        return {
            accessToken,
            refreshToken
        }

    } catch (error) {
        throw new apiError(500, error.message)
    }

}

const registerUser = asynchandler(async (req, res, next) => {


    // get user detail from frontend
    // validation - not empty
    // check if user already exist in db : email, username
    // check for image, check for avatar
    // upload them to cloudinary
    // create user object - create entry in db
    // remove password and refresh token feild from response
    // check for user creation
    // return respone 

    const { fullname, email, username, password } = req.body
    console.log('req.body', req.body)
    console.log(req.files)

    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
        throw new apiError(400, "All Fields are required")
    }

    if (fullname.length < 2 && fullname.length == 0 && !email.includes("@") ||
        email.startsWith("@") ||
        email.endsWith("@") ||
        email.split("@").length !== 2 ||
        email.split("@")[1].indexOf(".") === -1 ||
        email.split("@")[1].startsWith(".") ||
        email.split(".").pop().length < 2 && password.length < 8 || password.length == 0) {
        throw new apiError(400, "Invalid Creadentials")
    }

    const existedUser = await User.findOne(
        {
            $or: [
                { username },
                { email }
            ]
        }
    ) // ye query mein findOne ka use kiya gya hai then $or ka use kiya hai jo || opretor ka kaam karta hai then we use an array of object jismein username and email dono ki value check ki ja rahi hai. agr inme se koi ek bhi db se match kare toh wo user return kar dega otherwose null return karega. agr yaha $and ka use kiya hota toh dono ki value match karni chahiye thi. like && opretor

    if (existedUser) new apiError(409, "User with email and username already exist")
    // agr user exist karta hai toh error throw karega otherwose null return karega


    // req.files?.avatar[0]?.path yaha main concept h. ki agr req.files? exist krti h toh .avatar ke array me se .avatar[0] first obj retriev kro or agr path ni hai .avatar[0]? toh .path use kro isse path mil jyga jo multer ne upload kiya hai.
    const avatarLocalPath = req.files?.avatar[0]?.path // req.files multer vaale middleware se mila hai jo humne user.routes.js me banya hai ye path hota hai jaha file store hoti hai
    const coverLocalPath = req.files?.coverImg[0]?.path // req.files multer vaale middleware se mila hai jo humne user.routes.js me banya hai ye path hota hai jaha file store hoti hai

    if (!avatarLocalPath) {
        console.log('avatarLocalPath', avatarLocalPath);

        throw new apiError(400, "Avatar path is required") // here we check avatar is available or not. 
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath) // here we uplaod avatar on cloudinary using await cuz uploading me time lgta ha
    const coverImg = await uploadOnCloudinary(coverLocalPath) // here we uplaod coverImg on cloudinary using await cuz uploading me time lgta ha

    console.log('coverLocalPath', coverLocalPath)
    console.log('avatarLocalPath', avatarLocalPath)
    console.log('existedUser', existedUser)

    if (!avatar) throw new apiError(400, "Avatar is required") // checking avatar is available on cloudinary
    if (!coverImg) throw new apiError(400, "Cover Image is required") // checking coverImg is available on cloudinary

    const user = await User.create({
        fullname, // ye already validate kr diya hai
        avatar: avatar.url, // jab avatar db me store hoga tb hum chahte hai ki url store ho db me so we use (avatar.url)
        coverImg: coverImg?.url || "", // coverImg is not required field but here we check it for db saftery purpose using chaining, iska bhi url hi lenge hum jese avatar ka url liya tha
        email, // ye already validate kr diya hai
        password, // ye already validate kr diya hai
        username: username.toLowerCase() // username should be store in lowercase in db
    })

    const confirmCreatedUser = await User.findById(user._id)?.select( // yaha pe agr User.findById(user._id) iss id ke base pe user return ho toh using .select for remove that field password & refreshToken
        "-password -refreshToken" // hum password or refreshtoken ni bhejna chahte as respone so we use this syntax (agr bhul gye toh ask to ChatGPT)
    )

    if (!confirmCreatedUser) throw new apiError(500, "Something went wrong while user registration")

    return res.status(201).json(
        new apiResponse(200, confirmCreatedUser, "User Registred Successfully")
    )
})

const loginUser = asynchandler(async (req, res, next) => {
    // get user data from frontend || req.body -> data
    // check if user or email exist or not
    // find the user from db
    // check for password
    // generate access token and refresh token
    // send token using cookies 


    const { email, username, password } = req.body

    if (!username) throw new apiError(400, "Username is required")

    if (!email) throw new apiError(400, "Email is required")

    const user = await User.findOne({
        $or: [
            { username },
            { email }
        ]
    })


    if (!user) throw new apiError(400, "User not found")

    const checkPassword = await user.isPasswordCorrect(password) // here we check password is correct or not using isPasswordCorret method that we created in user.model.js    

    if (!checkPassword) throw new apiError(401, "Invalid Password")

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    // ye likh kr humne ye ensue kia ki hum user ko password or refreshToken ni bhejege as responsew

    const options = {
        httpOnly: true, // ye dono flags h inko use krne se koi bhi tumri cookies ko edit ni kr skta. btw cookies UI me show hogi but nobody can edit it.
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(200, {
                user: loggedInUser, accessToken, refreshToken
            }, "User loggin successfully")
        )
})

const loggedOutUser = asynchandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user?._id,
        {
            $unset: {
                refreshToken: 1 // for remove RefreshToken from DB
            }
        },
        {
            new: true // we use it for getting respone updated
        },
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new apiResponse(200, {}, "User Logged Out")
        )

    // for logout user we set our refrsh token undefined and clearCookie, cookies me accessToken or refreshToken h isiliye cookies delete ki aur refresh token bhi taaki logut successfully ho sake or accessToken is like session toh humne vo bhi khtm kr diya ab dubara login karna hoga then user get again refresh token and access token
})

const refreshAccessToken = asynchandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body?.refreshToken
    log(`incomingRefreshToken: ${incomingRefreshToken}`)
    if (!incomingRefreshToken) throw new apiError(401, "Unauthorized Request")

    try {

        const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedRefreshToken?._id)

        if (!user) throw new apiError("401", "Invalid refresh token")
        const userRefreshToken = user?.refreshToken

        if (incomingRefreshToken !== userRefreshToken) throw new apiError(400, "Session Expired");

        const { refreshToken, accessToken } = await generateAccessAndRefreshToken(decodedRefreshToken?._id)
        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("refreshToken", refreshToken, options)
            .cookie("accessToken", accessToken, options)
            .json(
                new apiResponse(200, {
                    accessToken, refreshToken
                }, "Access token refreshed")
            )

    } catch (error) {
        throw new apiError(401, error.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asynchandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body

    if (!(confirmPassword === newPassword)) throw new apiError(401, "Confirm password does not match the new password")

    const user = await User.findById(req.user?._id)
    if (!user) throw new apiError(400, "User not found")

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) throw new apiError(400, "Old Password is incorrect")
    console.log(user.password); // Yeh ab bhi accessible hoga

    user.password = newPassword

    user.refreshToken = null;
    try {
        await user.save(
            {
                validateBeforeSave: false
            }
        )
    } catch (error) {
        throw new apiError(400, error.message || "Error occure during save info in DB")
    }
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new apiResponse(200, {}, "Password Changed Successfully, Please login now")
        )
})

const changeCurrentInfo = asynchandler(async (req, res) => {

    const { newFullName, newEmail, newUsername } = req.body

    if ([newFullName, newEmail, newUsername].some((field) => field?.trim() === "")) {
        throw new apiError(400, "All Fields are required")
    }

    if (newFullName.length <= 2 && !email.includes("@") ||
        newEmail.startsWith("@") ||
        newEmail.endsWith("@") ||
        newEmail.split("@").length !== 2 ||
        newEmail.split("@")[1].indexOf(".") === -1 ||
        newEmail.split("@")[1].startsWith(".") ||
        newEmail.split(".").pop().length < 2) {
        throw new apiError(400, "Invalid Creadentials")
    }
    const userForValidation = await User.findById(req.user?._id).select("-password -refreshToken")

    if (userForValidation.fullname === newFullName && userForValidation.email === newEmail && userForValidation.username === newUsername) throw new apiError(401, "Please change the data either you can go step back")
    if (!userForValidation) throw new apiError(400, "User not found")

    try {
        const user = await User.findByIdAndUpdate(req.user?._id,
            {
                $set: {
                    newFullName,
                    newEmail,
                    newUsername
                }
            },
            {
                new: true // updated info / data return hoga aapko
            }
        ).select("-password")


        return res
            .status(200)
            .json(
                new apiResponse(200, user, "Data Changed Successfully")
            )

    }
    catch (error) {
        throw new apiError(400, error.message || "Error occure during save info in DB")
    }
})

const avatarUpdate = asynchandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) throw new apiError(400, "Avatar is file missing")

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) throw new apiError(400, "Error while uploading Avatar")

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }).select("-password")

    return res
        .status(200)
        .header()
        .json(
            new apiResponse(200, user, "Avatar Update Successfully")
        )
})

const coverImgUpdate = asynchandler(async (req, res) => {
    const coverImgLocalPath = req.file?.path

    if (!coverImgLocalPath) throw new apiError(400, "Cover Image is file missing")

    const coverImg = await uploadOnCloudinary(coverImgLocalPath)
    if (!coverImg.url) throw new apiError(400, "Error while uploading Cover Image")

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImg: coverImg.url
            }
        },
        {
            new: true
        }).select("-password")

    return res
        .status(200)
        .json(
            new apiResponse(200, user, "Cover Image Update Successfully")
        )
})

const deleteCoverImg = asynchandler(async (req, res) => {
    const user = await User.findById(req.user?._id)
    if (!user || !user.coverImg) throw new apiError(401, "User or cover image not found")

    const url = user?.coverImg;
    const publicId = getPublicId(url)
    
    const deleteCoverImgFromCloudinary = deleteFromCloudinary(publicId)
    if (!deleteCoverImgFromCloudinary) throw new apiError(401, "Task failed due to server error... Try again")

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset: {
                coverImg: 1
            }
        },
        {
            new: true
        }
    );
    return res
        .status(200)
        .json(new apiResponse(200, updatedUser, "Cover Image Delete Successfully"))

})
const getCurrentUser = asynchandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new apiResponse(200, req.user, "User Found")
        )
})

const getUserChannelProfile = asynchandler(async (req, res) => {
    const { username } = req.params // yaha humne req.params isliye use kiya h cuz jb bhi hum kisi channel ko visit krna chahte h toh uske parameters (URL) se hi usko access kr skte h. so this parameter is params
    if (!username?.trim()) throw new apiError(400, "User not found")

    // Agregation Pipeline start
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
                // aggregate use krne ke baad return value always array hoga 
            }
        },
        // hum yaha lookup isiliye use kr rhe kyuki hum matched user ke basis p subscription dekh lenge
        {
            // subscription model me se subscription liya jo ek model name h,
            $lookup: {
                from: "subscriptions", // ye model h subscription.model.js file me se or (isko DB, model, table maan lo ye feilds contain kr skta h more then 1 at a time)

                localField: "_id", // ye local field h hamare hi subscription model ka
                foreignField: "channel", // ye foreign field h dusri tabla ka i.e. channel
                as: "subscribers" // ye final result hold krega 

                // this pipeline is use for finding subscribers
            },
            $lookup: {
                from: "subscriptions", // isko DB, model, table maan lo ye feilds contain kr skta h more then 1 at a time
                localField: "_id",
                foreignField: "subscriber",
                as: "subscriberTo"
                // this pipeline is use for track that how many channels are subscribed by me.
            },
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers", // ye phle vaale lookup se aya h
                },
                channelSubscriberCount: {
                    $size: "$subscriberTo", // ye dusre vaale lookup se aya h
                },
                // here we degsin functionality of subscribed button using if $condi and returning boolean value
                isSubscribedChannel: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"]
                            // $in ye array or object me sab dekh leta
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscriberCount: 1,
                isSubscribedChannel: 1,
                avatar: 1,
                coverImg: 1
            }
        }
    ])
    console.log(channel)
    if (!channel?.length) throw new apiError(404, "Channel not found")

    return res
        .status(200)
        .json(
            new apiResponse(200, channel[0], "User Chanel fetched")
        )
})

// Note: MongoDB ki jo _id h vo hume ek string milti h na ki koi actual id 
// i.e. ObjectId('746bsd1281368nd') kuch iss trh ki dikhti h id but...
// jab hum uss _id ko use krte hai mongoose ke though like findById toh...
// mongoose uss _id ko (jo ki ek string h) behind the secen khud handle karta hai
const getWatchHistory = asynchandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
                // id string hoti ha so we use Types.ObjectId(req.user._id).
                // yaha Types me bata rhe hai ki (req.user._id) ka type ObjectId hai
                // yaha (req.user._id) isiliye use kiya taaki authenticated user ka _id hi mile
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                                // owner ek field h jo video.model.js me hai so we use $owner
                            }
                        }
                    }
                    // ref: chai or backend video no. 20 
                ]
            }
            // yaha pe videos humne video.model.js se liya hai 
            // watchHistory hamara local feild h user.model.js se
            // foreign feild hamara vo fiedl hai jo video.model.js me h
            // toh yaha pe humne ye pipeline user.model.js me likhi h
            // kyuki localField: "watchHistory" h. jo ki user.model.js me h
        }
    ])

    return res
        .status(200)
        .json(
            new apiResponse(200, user[0].watchHistory, "Watch History Fetch Successfully")
        )
})

export {
    registerUser,
    loginUser,
    loggedOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    changeCurrentInfo,
    avatarUpdate,
    coverImgUpdate,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory,
    deleteCoverImg
}