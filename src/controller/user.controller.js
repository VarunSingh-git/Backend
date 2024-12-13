import { asynchandler } from "../utils/async.handler.js";

const registerUser = asynchandler(async (req, res, next) => {
    res.status(200).json({
        message: "varun"
    })
})

export { registerUser }
