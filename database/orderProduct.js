const mongoose = require('mongoose')
const OrderProductSchema = new mongoose.Schema({
    payment_request_id:String,
    products:Object
});

module.exports = mongoose.model("orderProduct",OrderProductSchema)