const mongoose = require('mongoose')
require('dotenv').config()
//mongoose.connect('mongodb://127.0.0.1:27017/e-commerce')
// mongoose.connect('mongodb+srv://avinash:avinash@cluster0.kpe1q.mongodb.net/e-comm')
mongoose.connect(process.env.MONGO_URL)