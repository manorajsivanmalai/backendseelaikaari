// server.js
const express = require('express');
const cors =require("cors");
const app = express();
const dotenv = require('dotenv');
const { SitemapStream, streamToPromise } = require("sitemap");
dotenv.config(); 
app.use(express.json()); 
app.use(cors());
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

app.get("/sitemap.xml", async (req, res) => {
    const sitemap = new SitemapStream({ hostname: "https://www.seelaikaari.com" });
  
    sitemap.write({ url: "/", changefreq: "daily", priority: 1.0 });
    sitemap.write({ url: "/Product", changefreq: "daily", priority: 0.8 });
    sitemap.write({ url: "/contact", changefreq: "daily", priority: 0.6 });
    sitemap.write({ url: "/About", changefreq: "daily", priority: 0.5 });
    sitemap.write({ url: "/Stories", changefreq: "daily", priority: 0.9 });
    sitemap.write({ url: "/login", changefreq: "daily", priority: 0.3 });
    sitemap.write({ url: "/Cart", changefreq: "daily", priority: 0.6 });
    sitemap.write({ url: "/Wishlist", changefreq: "daily", priority: 0.3 });
    sitemap.end();
  
    const xml = await streamToPromise(sitemap);
    res.header("Content-Type", "application/xml");
    res.send(xml.toString());
  });

// module.exports = app;
// module.exports.handler = serverless(app); 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
