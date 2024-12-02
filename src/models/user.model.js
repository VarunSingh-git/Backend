import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";

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
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, "Password is Mandotry"]
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true })


// this is pre hook. this is use for save data (we can add or apply some logic that data send to db) before saving info in db.
userSchema.pre("save", async function (next) { // here we dont use arrrow func cuz arrow func has no access of 'this' keyword.
    if (!this.isModified("password")) return next() // here we check that if password is not modified then goto next flag otherwise goto encryption method.

    this.password = bcrypt.hash(this.password, 10) // this is use for make hash of password
    next()
})

// here we check that password exist or not.
userSchema.methods.isPasswordCorret = async function (password) {
    return await bcrypt.compare(password, this.password) // compare is method that present in bcrypt pkg. for comparing password that already exist in db.
}

userSchema.methods.getAccessToken = async function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.getRefreshToken = async function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
// jwt is bearer token. ye token jiske pass hai usko data bheja jayga.

export const User = mongoose.model("User", userSchema)