import mongoose from "mongoose";

const connection = mongoose.connect('mongodb://127.0.0.1:27017/passport-jwt')

const schema = mongoose.Schema({
    email: String,
    password: String
})

const User = mongoose.model('user', schema);

export default User;