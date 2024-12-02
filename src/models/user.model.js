import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    username: {
        type: String,
        lowercase: true,
        trim: true,
        required: true,
        unique: true,
        index: true
    },

    email: {
        type: String,
        lowercase: true,
        trim: true,
        required: true,
        unique: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, // cloudnary use hoga for store
        required: true,
    },
    coverImg: {
        type: String
    },
    watchHistory:[
        {
            type: mongoose.Schema.ObjectId.
            re 
        }
    ]

})

export const User = mongoose.model("User", userSchema)