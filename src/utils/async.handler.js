const asynchandler = (reqHandler) => {
  return (req, res, next) => {
    Promise.resolve(reqHandler(req, res, next)).catch((err) => next(err));
  };
};
export { asynchandler };

// const asyncHandler = (fn) => () => { } // this is higher order function (() => { }) this is function that taken by asyncHandler function

// this is simpler way of upper given code. this is also a wrapper function

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (err) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }
