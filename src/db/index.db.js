import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from "dotenv"
dotenv.config({
    path: './env'
})

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) // connection study
        
        console.log(`\n MongoDB connect !! DB Host ${connectionInstance.connection.host}`); // study
    } catch (error) {
        console.log(`ERROR: ${error}`);
        process.exit(1) // study 
    }
}

export default connectDB



// here we write our code directly (this is 2nd approach)
// const app = express()

// ;(async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(err)=>{
//             console.log(`ERROR: ${err}`);
//             throw err
//         })
        
//         app.listen(process.env.PORT, ()=>{
//             console.log(`App is listening on ${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.log(`ERROR: ${error}`);
//         throw error
//     }
// })()