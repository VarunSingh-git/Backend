import { Router } from "express";
import { registerUser } from "../controller/user.controller.js";
import { upload } from "../middlewars/multer.middleware.js";

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


export default router;