import { v2 as cloudinary } from 'cloudinary' // cloudinary is a npm package that is used to upload file on cloudinary server.
import fs from "fs" // fs is 'file system 'that is in-built in node js. file par CRUD operation ke liye use hota hai.
import { hasUncaughtExceptionCaptureCallback } from "process";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_SECRET // Click 'View API Keys' above to copy your API secret
});
// file upload concept
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) { return null }
        // upload file on cloudinary
        const respone = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log(`response: ${respone}`)
        fs.unlinkSync(localFilePath)
        return respone

    }
    catch (err) {
        fs.unlinkSync(localFilePath) // remove the locally saved file as the upload operation go failed
        return null
    }
}

export { uploadOnCloudinary }

// const uploadResult = await cloudinary.uploader
//     .upload(
//         'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//         public_id: 'shoes',
//     })
//     .catch((error) => {
//         console.log(error);
//     });

// console.log(uploadResult);