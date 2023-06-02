import mongoose, { mongo } from "mongoose";

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



const fileSchema = mongoose.Schema({
    filename: {
        type: String,
        required: true,
        unique: true
    },
    id: {
        type: String,
        required: true,
        unique: true
    },
    url: String,
    uploaded_by: {
        type: [mongoose.Schema.Types.Mixed]
    },
})

const User = mongoose.model('user', schema);
const File = mongoose.model('file', fileSchema);
export {File, User};
export default User;