// server.js
const express = require('express');
const cors =require("cors");
const app = express();
const dotenv = require('dotenv');
dotenv.config(); 
app.use(express.json()); 
app.use(cors());
const db = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const productsRoutes=require("./routes/productRoutes");
const wishlistRoutes=require("./routes/wishlistRoutes");
const addtocartRoutes=require("./routes/cartRoutes");
const orderRoutes=require("./routes/orderRoutes");


app.use('/api/users', userRoutes);
app.use('/api/products',productsRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/addtocart",addtocartRoutes);
app.use("/api/order", orderRoutes);

app.use("/",(req,res)=>{
    res.send("server is running");
})



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
