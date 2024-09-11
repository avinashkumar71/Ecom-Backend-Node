const mongoose = require('mongoose')
const CodOrderSchema = new mongoose.Schema({
    user_id:String,
    amount:Number,
    products:Object,
    address:Object,
    payment_status:String
});

module.exports = mongoose.model("CODOrder",CodOrderSchema)