import mongoose from "mongoose";

const schema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    nim: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: "Please enter a valid email"
        },
        required: [true, "Email required"]
    },
    password:{
        type: String,
        required: true
    }
})

const User = mongoose.model('user', schema);

export default User;