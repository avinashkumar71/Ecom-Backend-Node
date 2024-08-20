const mongoose = require('mongoose')
const SellerUserSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    company:String,
    gst:String,
    phone:String,
    aadhar:String,
    pan:String,
    domain:String,
    is_seller:Boolean,
    is_created_Buyer_account:Boolean
});

module.exports = mongoose.model("seller_user",SellerUserSchema)