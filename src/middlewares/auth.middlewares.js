import { apiError } from "../utils/apiError.js";
import { asynchandler } from "../utils/async.handler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

const verifyJWT = asynchandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        // here we use two conditions 
        // 1. req.cookies?.accessToken
        // 2. req.header("Authorization")?.replace("Bearer ", "")
        // Explain
        // 1. firstly req.cookies checked if it's has some value then get accessToken from req.cookies?.accessToken
        // but here we use it req.header("Authorization")?.replace("Bearer ", "") cuz user mobile app me agr hua toh vaha p cookie ni hoti vaha pe header hote hai
        // 2. so req.header() ek method h jisme 'Authorization' naam ka ek header hota h
        // jisme token ese bheje jaate hai - Authorization: Bearer <token> (this is syntax)
        // so here we cheack if req.header("Authorization") hai toh usme se token lo or usme .replace()
        // lagao, jaha Bearer ho usko "" se replace krdo, toh tumko token mil jyenge
        if (!token) throw new apiError(401, "Unauthorized Request")

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) throw new apiError(401, "Invalid Access Token")

        req.user = user
        // here req.user me user ek object add kiya h or iske andar user (db vale) ka access diya h 
        next()
    } catch (error) {
        throw new apiError(401, error?.message || "Invalid access token")
    }
})

export { verifyJWT }





















