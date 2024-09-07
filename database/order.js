const mongoose = require('mongoose')
const OrderSchema = new mongoose.Schema({
    payment_request_id:String,
    user_id:String,
    amount:Number,
    payment_status:String
});

module.exports = mongoose.model("order",OrderSchema)