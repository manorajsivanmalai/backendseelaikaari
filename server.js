// server.js
const express = require('express');
const cors =require("cors");
const app = express();
const dotenv = require('dotenv');
const allowedOrigin = 'https://seelaikaari.com';

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || origin === allowedOrigin) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   }
// }));
app.use(cors())
dotenv.config(); 
app.use(express.json()); 

const db = require('./config/db');
const serverless = require("serverless-http");
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



// module.exports = app;
// module.exports.handler = serverless(app); 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
