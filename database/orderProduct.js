const mongoose = require('mongoose')
const OrderProductSchema = new mongoose.Schema({
    payment_request_id:String,
    products:Object,
    address:Object,
    payment_mode:String
});

module.exports = mongoose.model("orderProduct",OrderProductSchema)