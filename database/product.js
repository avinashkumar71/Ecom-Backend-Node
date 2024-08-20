const mongoose = require('mongoose')
const ProductSchema = new mongoose.Schema({
    productname:String,
    price:Number,
    discount:Number,
    selling_price:Number,
    qty:Number,
    category:String,
    description:String,
    ImageUrl:String,
    user_id:String
});

module.exports = mongoose.model("product",ProductSchema)