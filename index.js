const express = require('express')
const app = express()
const multer = require('multer')
const cors = require('cors')
const Jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary')
require('dotenv').config()
const fs = require('fs');

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
const corsOrigin = 'http://localhost:3000';
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
            console.log('---------->',err)
        }
        else { 
          console.log("file deleted ------------>") 
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
                delete user.phone
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
        console.log('user ---------->',user)
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
    const SellingPrice =Math.floor(data.price - data.price*data['discount']/100);
    data['selling_price'] = SellingPrice
    data['ImageUrl'] = request.file.filename
    const result = await Products.updateOne(request.params,{$set:data})
    response.send(result)
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