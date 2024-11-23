import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from "dotenv"
dotenv.config({
    path: './env'
})

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) // connection study
        console.log(`\n MongoDB connect !! DB Host ${connection.connection.host}`); // study
    } catch (error) {
        console.log(`ERROR: ${error}`);
        process.exit(1) // study 
    }
}

export default connectDB