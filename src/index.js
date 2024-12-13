// we import database connection file from ./db/index.js (this is 1st approach)
import connectDB from "./db/index.db.js";
import app from "./app.js"
import dotenv from "dotenv"
dotenv.config({
    path: './env'
}) // when we use import module syntax for dotnv then we should write down config of .env


connectDB()
    .then(() => {
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running at: ${process.env.PORT}`);
            app.on("error", (err) => {
                console.log('This is ERROR:', err);

            })
        })
    })
    .catch((err) => console.log(err));