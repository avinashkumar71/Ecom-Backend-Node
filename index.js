const express = require('express')
const app = express()
const multer = require('multer')
const cors = require('cors')
const Jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary')
require('dotenv').config()
const fs = require('fs');

const Insta = require('instamojo-nodejs');
Insta.setKeys(process.env.INSTA_API_KEY, process.env.INSTA_AUTH_KEY)
Insta.isSandboxMode(true);

const port = process.env.PORT
const jwtkey = process.env.JWTKEY 

cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECRECT // Click 'View API Keys' above to copy your API secret
})

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   next();
// });

const corsOrigin = 'https://ecom-frontend-node.onrender.com';
app.use(cors({
  origin:[corsOrigin],
  methods:['GET','POST','DELETE','PUT'],
  credentials: true 
}));

app.use('/',express.static('uploads'))

require('./database/config')
const Users = require('./database/user')
const Products = require('./database/product')
const SellerUser = require('./database/seller_user');
const Orders = require('./database/order')
const OrderProducts = require('./database/orderProduct')
const path = require('path');


const upload = multer({
    storage:multer.diskStorage({
        destination:function(request,file,cb){
            cb(null,'uploads')
        },
        filename:function(request,file,cb){
            cb(null,file.fieldname + "-" + Date.now() + ".jpg")
            
        }
    })
}).single("image")

app.post('/file-upload',upload,async(request,response)=>{
    let body = JSON.parse(request.body.data)
    // console.log('---------------->',body)
    // console.log('--------->',request.file)

    const cloudinary_image_link =await cloudinary.uploader.upload(request.file.path)
    console.log('------>',cloudinary_image_link.secure_url)
    
    const SellingPrice =Math.floor(Number(body.price) - Number(body.price)*Number(body.discount)/100);
    console.log(body.productname,body.price,body.discount,SellingPrice,body.qty,body.category)
    const product = new Products({
        productname:body.productname,
        price:Number(body.price),
        discount:Number(body.discount),
        selling_price:SellingPrice,
        qty:Number(body.qty),
        category:body.category, 
        description:body.description,
        ImageUrl:cloudinary_image_link.secure_url,
        user_id:body.user_id
    })
    let result = await product.save()

    fs.unlink(request.file.path, (err) => { 
        if(err){
            // console.log('---------->',err)
        }
        else { 
        //   console.log("file deleted ------------>") 
        } 
      }); 
    response.send(result)
})

app.get('/all-products',async(request,response)=>{
    const product = await Products.find()
    response.send(product)
})


app.post('/customer-register',async (request,response)=>{
    // console.log(request.body)
    const data = new Users(request.body)
    let user =await data.save()
    if(user){
        Jwt.sign({user},jwtkey,{expiresIn:"1h"},(err,token)=>{
            if(err){
                response.send({result:"something went wrong"})
            }else{
                user = user.toObject()
                delete user.password
                delete user.is_seller
                response.send({user,auth:token}) 
            }         
        })
    }else{
        response.send('user is not valid')
    }
})

app.post('/seller-register',async (request,response)=>{
    const data = new SellerUser(request.body)
    let result =await data.save()
    result = result.toObject()

    let for_customer_data = result
    if (for_customer_data.is_created_Buyer_account===true){
        delete for_customer_data.company
        delete for_customer_data.gst
        delete for_customer_data.aadhar
        delete for_customer_data.pan
        delete for_customer_data.domain
        delete for_customer_data.is_seller
        delete for_customer_data.is_created_Buyer_account

        const customer_data = new Users(for_customer_data)
        await customer_data.save()
    }
    
    delete result.password
    response.send(result)
})

app.post('/seller-login',async (request,response)=>{
    if(request.body.email && request.body.password){
        const user =await SellerUser.findOne(request.body).select(["-password","-is_created_Buyer_account","-is_seller"])
        // console.log('user ---------->',user)
        if(user){
            Jwt.sign({user},jwtkey,{expiresIn:"1h"},(err,token)=>{
                if(err){
                    response.send({result:"something went wrong"})
                }else{
                    response.send({user,auth:token}) 
                }         
            })  
        }else{
            response.send({'result':'no account'})
        }
        
    }else{
        response.send({'result':'All Fields are Mandatory'})
    }  
})

app.post('/customer-login',async (request,response)=>{
    if(request.body.email && request.body.password){
        const user =await Users.findOne(request.body).select("-password")
        if(user){
            Jwt.sign({user},jwtkey,{expiresIn:"1h"},(err,token)=>{
                if(err){
                    response.send({result:"something went wrong"})
                }
                    response.send({user,auth:token})  
            })
        }
    }else{
        response.send('credential not match')
    }  
})

app.post('/all-products-by-user/:user_id',async (request,response)=>{
    const product = await Products.find(request.params)
    response.send(product)
})

app.delete('/delete-product/:_id',async(request,response)=>{
    const data = await Products.deleteOne(request.params)
    response.send(data)
})

app.post('/update-product/:_id',upload,async(request,response)=>{
    const data = JSON.parse(request.body.data)
    // console.log('request file path',request.file)
    if(request.file !== undefined){
        const cloudinary_image_link =await cloudinary.uploader.upload(request.file.path)
        // console.log('------>',cloudinary_image_link.secure_url)
        data['ImageUrl'] = cloudinary_image_link.secure_url

        fs.unlink(request.file.path, (err) => { 
            if(err){
                console.log('---------->',err)
            }
            else { 
              console.log("file deleted ------------>") 
            } 
          }); 
    }

    const SellingPrice =Math.floor(data.price - data.price*data['discount']/100);
    data['selling_price'] = SellingPrice
    const result = await Products.updateOne(request.params,{$set:data})
    response.send(result)
})

app.get('/get-update-product-details/:_id',async(request,response)=>{
    const result = await Products.find(request.params)
    response.send(result)
})

app.post('/pay',async(request,response)=>{
        const body = request.body
        const data = new Insta.PaymentData();
        console.log('data coming from frontend------>',body)
        data.purpose = "Buying Products";
        data.currency = 'INR'   
        data.buyer_name = `${body.name}`
        data.email = `${body.email}`  
        data.phone = `${body.phone}`  
        data.amount = `${body.amount}`
        data.send_email = true
        // data.setRedirectUrl('http://localhost:3000/success');
        data.setRedirectUrl('https://ecom-frontend-node.onrender.com/success');
        Insta.createPayment(data,async function(error, res) {
        if (error) {
            console.log(error)
        } else {
            const responseData = await JSON.parse(res)
            console.log('responsedata-------->',responseData)
            const OrderDetails = {
                payment_request_id:responseData.payment_request.id,
                user_id:body.user_id,
                amount:body.amount,
                payment_status:responseData.payment_request.status
            }
            const Order_Data = new Orders(OrderDetails);
            await Order_Data.save()

            const OrderProductDetails = {
                payment_request_id:responseData.payment_request.id,
                products:body.order_products,
                address:body.address
            }

            const order_products = new OrderProducts(OrderProductDetails)
            await order_products.save()

            response.send(responseData.payment_request) 
        }
        });
})

app.post('/success',async(request,response)=>{
    const result = await Orders.updateOne({payment_request_id:request.body.payment_request_id},{$set:{payment_status:request.body.payment_status}})
    response.send('done')
})

function VerifyToken(request,response,next){
    let token = request.body.headers['authorization']
    if(token){
        token = token.split(' ')[1]
        Jwt.verify(token,jwtkey,(err,valid)=>{
            if(err){
                response.send('-1')
            }else{
                next()
            }
        })
    }else{
        response.send('-1')
    }
}

app.listen(port,()=>{
    console.log('app is running .....')
})
