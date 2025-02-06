import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

// app.use(cors()) // this is okk but we can use object or more options in this
// app.use() is mostly use for setup middleware or configure files like we config below

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" })); // this is limit of our json file i.e. 16kb
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // url se aane vale sab parameters ko encoded krne ke liye express.urlencoded and we use (extended: true) taaki params nested roop me aa sake in json file
app.use(express.static("Public")); // express.static is use for save files like photos, pdf, txt file etc. on our local storage or server. so here "Public" is folder that exist in my current dir.
app.use(cookieParser()); // for set or manipulate cookies in user browser. by the way it's also contain object like core() but this is not neccessary right now.

// Routes import
import userRouter from "./routes/user.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

// Route Declaration

// phle hum app.get ki help se route likhte the aur vahi pe controller bhi but ab esa nahi hoga kyuki humne sab files ko seperate kar diya hai toh ab hume route ko use karne ke liye ya laane ke liye middleware ka use karna hoga i.e. app.use()

// here /api/v1/users is prefix and userRouter is router that import from user.routes.js

app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);

// http://localhost:8000/api/v1/users/register

export { app };

export default app;
// agr humne kisi function ko default export kiya hai tab hum bina curly braces ke or koi bhi naaam dekar usko import kar skte hai. but if don't use default export statement then we use curly braces and same name as function
