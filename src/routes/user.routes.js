import { Router } from "express";
import {
    registerUser,
    loginUser,
    loggedOutUser,
    refreshAccessToken,
    changeCurrentPassword
} from "../controller/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()

router.route("/register").post(
    upload.fields([ // ye fields use hota hai jab hum multiple files ko upload karna chahte hain. or yaha name frontend se aaya hai jo humne define kiya tha. maxCount use hota hai jab hum multiple files ko upload karna chahte hain or hume define karna hota hai ke kitne files ko upload karna hai.
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImg",
            maxCount: 1
        }
    ]),
    registerUser // registerUser kya hai ? ye humne user.controller.js me define kiya hai.
)

router.route("/login").post(
    loginUser
)

router.route("/logout").post(
    verifyJWT,
    // ye middleware ensur krega ki user exist krta h ya nhi if user exist then we goto loggedOutUser for logout user 
    loggedOutUser
)
router.route("/refresh-Token").post(
    refreshAccessToken
)

router.route("/change-CurrentPassword").post(
    verifyJWT,
    changeCurrentPassword
)

export default router;