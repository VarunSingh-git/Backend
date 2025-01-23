import { v2 as cloudinary } from 'cloudinary' // cloudinary is a npm package that is used to upload file on cloudinary server.
import fs from "fs" // fs is 'file system 'that is in-built in node js. file par CRUD operation ke liye use hota hai.
import { hasUncaughtExceptionCaptureCallback } from "process";
import { apiError } from "../utils/apiError.js";
// import { apiResponse } from "../utils/apiResponse.js"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_SECRET // Click 'View API Keys' above to copy your API secret
});
// file upload concept


const getPublicId = (url) => {
    const publicId = url.split('/')
    const finalPublicId = (publicId.slice(-2).join('/')).split('.')[0]
    return finalPublicId
}
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    }

    catch (error) {
        throw new apiError(400, error || "Server Error Occur! Try Again")
    }
}
const updateOnCloudinary = async (localFilePath, publicId) => {
    if (!localFilePath) { return null }
    try {
        const result = await cloudinary.uploader.upload(localFilePath, {
            public_id: publicId,
            overwrite: true,
            resource_type: "auto"
        })
        fs.unlinkSync(localFilePath) // remove the locally saved file as the upload operation go failed either success
        return result
    } catch (error) {
        fs.unlinkSync(localFilePath)
        throw new apiError(400, "Couldn't update video" || error.message)
    }
}

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) { return null }
        // upload file on cloudinary
        const respone = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        fs.unlinkSync(localFilePath) // remove the locally saved file as the upload operation go failed either success
        return respone
    }
    catch (err) {
        fs.unlinkSync(localFilePath) // remove the locally saved file as the upload operation go failed either success
        return null
    }
}

export {
    uploadOnCloudinary,
    getPublicId,
    deleteFromCloudinary,
    updateOnCloudinary
}

// const uploadResult = await cloudinary.uploader
//     .upload(
//         'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//         public_id: 'shoes',
//     })
//     .catch((error) => {
//         console.log(error);
//     });

// console.log(uploadResult);