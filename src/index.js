// require('dotenv').config({ path: './env'})
import mongoose from "mongoose";
import dotenv from "dotenv"
import express from "express"
import { DB_NAME } from "./constants.js";
dotenv.config({
    path: './env'
}) // when we use import module syntax for dotnv then we should write down config of .env


// here we write our code directly (this is 2nd approach)
const app = express()

;(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(err)=>{
            console.log(`ERROR: ${err}`);
            throw err
        })
        
        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on ${process.env.PORT}`);
        })
    } catch (error) {
        console.log(`ERROR: ${error}`);
        throw error
    }
})()



// we import database connection file from ./db/index.js (this is 1st approach)
/*import connectDB from "./db/index.js";


connectDB()*/ 