import { apiError } from "../utils/apiError.js";
import { asynchandler } from "../utils/async.handler.js";
import { apiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudnary.js"
import { log } from "console"
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

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
            $set: {
                refreshToken: undefined
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
        log(`user: ${user}`)
        log(`decodedRefreshToken: ${decodedRefreshToken.payload}`)

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

    const { newFullName, newEmail, newUsername} = req.body

    if ([newFullName, newEmail, newUsername].some((field) => field?.trim() === "")) {
        throw new apiError(400, "All Fields are required")
    }


    if (newFullName.length < 2 && newFullName.length == 0 && !email.includes("@") ||
        newEmail.startsWith("@") ||
        newEmail.endsWith("@") ||
        newEmail.split("@").length !== 2 ||
        newEmail.split("@")[1].indexOf(".") === -1 ||
        newEmail.split("@")[1].startsWith(".") ||
        newEmail.split(".").pop().length < 2) {
        throw new apiError(400, "Invalid Creadentials")
    }
    const user = await User.findById(req.user?._id).select("-password -refreshToken")

    if (user.fullname === newFullName && user.email === newEmail && user.username === newUsername) throw new apiError(401, "Please change the data either you can go step back")
    if (!user) throw new apiError(400, "User not found")

    user.fullname = newFullName
    user.email = newEmail
    user.username = newUsername

    try {
        await user.save(
            {
                validateBeforeSave: false
            }
        )
    } catch (error) {
        throw new apiError(400, error.message || "Error occure during save info in DB")
    }

    return res
        .status(200)
        .json(
            new apiResponse(200, user, "Data Changed Successfully")
        )


})

export {
    registerUser,
    loginUser,
    loggedOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    changeCurrentInfo
}