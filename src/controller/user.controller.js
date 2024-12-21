import { apiError } from "../utils/apiError.js";
import { asynchandler } from "../utils/async.handler.js";
import { apiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudnary.js"

const emailValidate =
    !email.includes("@") ||
    email.startsWith("@") ||
    email.endsWith("@") ||
    email.split("@").length !== 2 ||
    email.split("@")[1].indexOf(".") === -1 ||
    email.split("@")[1].startsWith(".") ||
    email.split(".").pop().length < 2

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


    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new apiError(400, "All Fields are required")
    }

    if (fullName.length < 2 || fullName.length === "" && emailValidate && password.length < 8 || password.length === "") {
        throw new apiError(400, "Invalid Input")
    }

    const existedUser = User.findOne(
        {
            $or: [
                { username },
                { email }
            ]
        }
    ) // ye query mein findOne ka use kiya gya hai then $or ka use kiya hai jo || opretor ka kaam karta hai then we use an array of object jismein username and email dono ki value check ki ja rahi hai. agr inme se koi ek bhi db se match kare toh wo user return kar dega otherwose null return karega. agr yaha $and ka use kiya hota toh dono ki value match karni chahiye thi. like && opretor

    existedUser ? new apiError(409, "User with email and username already exist") : new apiError(500, "Internl Server Error") // agr user exist karta hai toh error throw karega otherwose null return karega

    const avatarLocalPath = req.files?.avatar[0]?.path // ye path hota hai jaha file store hoti hai
    const coverLocalPath = req.files?.coverImage[0]?.path // ye path hota hai jaha file store hoti hai

    req.files ? console.log(`req.files.avatar[0]: ${req.files.avatar[0]}`) : 'Error in avatar' // here we check and doing console.log of req.files.avatar[0]
    req.files ? console.log(`req.files.coverImage[0]: ${req.files.coverImage[0]}`) : 'Error in coverImage' // here we check and doing console.log of req.files.coverImage[0]


    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar is required") // here we ensure that avatar is available.
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath) // here we uplaod avatar on cloudinary using await cuz uploading me time lgta ha
    const coverImg = await uploadOnCloudinary(coverLocalPath) // here we uplaod coverImg on cloudinary using await cuz uploading me time lgta ha

    console.log('coverLocalPath', coverLocalPath)
    console.log('avatarLocalPath', avatarLocalPath)
    console.log('existedUser', existedUser)

    if (!avatar) throw new apiError(400, "Avatar is required") // checking avatar is available on cloudinary

    const user = await User.create({
        fullName, // ye already validate kr diya hai
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

export { registerUser }
