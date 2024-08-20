const mongoose = require('mongoose')
const UserSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    phone:String,
    is_seller:Boolean
});

module.exports = mongoose.model("users",UserSchema)