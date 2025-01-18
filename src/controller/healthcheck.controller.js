import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js"
import { asynchandler } from "../utils/async.handler.js"


const healthcheck = asynchandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
})

export {
    healthcheck
}
