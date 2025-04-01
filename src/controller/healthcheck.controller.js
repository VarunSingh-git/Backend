import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asynchandler } from "../utils/async.handler.js";

const healthcheck = asynchandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, { status: "OK" }, "Server is running smoothly"));
});

export { healthcheck };
