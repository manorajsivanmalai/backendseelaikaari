const orderModel  = require("../models/orderModel.js");
const nodemailer = require("nodemailer");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const {getShipRocketToken} =require("../utils/shipAuth.js")
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Step 1: Create Razorpay Order
const createRazorpayOrder = async (req, res) => {   
  try {
    const { amount } = req.body;
    console.log(amount);
    
    if (!amount) {
      return res.status(400).json({ success: false, message: "Amount is required!" });
    }

    const options = {
      amount: amount * 100, 
      currency: "INR",
      receipt: `receipt#1`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ success: false, message: "Error creating Razorpay order", error: error.message });
  }
};


const verifyPaymentAndCreateOrder = async (req, res) => {
  try {
    const {
      order_id, userDetails,payment_id,signature,country="India",
      payment_method="Prepaid", shipping_charges=10, totalAmount, weight="2", cartItems,user
    } = req.body;
 
    if (!order_id || !payment_id || !signature || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Missing required payment fields or cart is empty!" });
    }

    // Verify Razorpay Payment Signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(order_id + "|" + payment_id)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature!" });
    }


    const newOrder = {
      order_id: order_id || null,
      customer_name: userDetails.name || null,
      email: userDetails.email || null,
      phone: userDetails.phone || null,
      address: userDetails.address1 || null,
      city: userDetails.city || null,
      state: userDetails.state || null,
      payment_id:payment_id,
      signature:signature,
      country: country || 'India',  // Default to 'India'
      pincode: userDetails.pincode || null,
      payment_method: payment_method || 'Prepaid',
      shipping_charges: shipping_charges || 0,
      total_amount: totalAmount || 0,
      weight: weight || 0.5,  // Default to 0.5 if weight is not provided
      order_items:cartItems,
      user
    };
  const result = await orderModel.createOrder(newOrder);
  console.log(result.id)
    // Insert order items into the cartItems table
    for (let item of cartItems) {
      const orderItem = {
        order_id: result[0].id,   // The ID of the order we just created
        product_id: item.id,  // From the request body
        quantity: item.quantity || 1, // Default to 1 if quantity is not provided
        price: item.price || 0,       // Default to 0 if price is missing
        total_amount: parseInt(item.price)*parseInt(item.quantity) || 0
      };
        await orderModel.createOrderItem(orderItem);
    }

    // Get ShipRocket API token
    const token = await getShipRocketToken();

    // Create the order in ShipRocket
   const shipmentID = await orderModel.createShipRocketOrder(newOrder, token);

    // Nodemailer setup

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const customerMailOptions = {
      from: process.env.EMAIL_USER,
      to: userDetails.email,
      subject: "Order Confirmation from Akilesh Store",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
          <div style="text-align: center; padding-bottom: 20px;">
            <h2 style="color: #4CAF50;">Thank You for Your Order, ${userDetails.name}!</h2>
            <p style="color: #555;">Your payment was successful, and your order has been placed.</p>
          </div>
    
          <div style="background: #ffffff; padding: 15px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h3 style="color: #333;">Order Details:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd;">Item</th>
                  <th style="text-align: center; padding: 10px; border-bottom: 2px solid #ddd;">Quantity</th>
                  <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${cartItems.map(item =>`
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">₹${item.price}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
    
            <div style="margin-top: 20px; text-align: right;">
              <h3 style="color: #4CAF50;">Total Amount Paid: ₹${totalAmount}</h3>
            </div>
          </div>
    
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #666;">You will receive a tracking link once your order is shipped.</p>
            <a href="#" style="display: inline-block; padding: 10px 20px; background: #4CAF50; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Order</a>
          </div>
    
          <div style="margin-top: 20px; text-align: center; padding: 15px; font-size: 12px; color: #999;">
            <p>For any queries, contact us at support@akileshstore.com</p>
            <p>&copy; 2025 Akilesh Store. All rights reserved.</p>
          </div>
        </div>
      `
    };
    // Email to Store Owner
    const ownerMailOptions = {
      from: process.env.EMAIL_USER,
      to: "smanoraj25@gmail.com",
      subject: "New Order Received - Akilesh Store",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #4CAF50; text-align: center;">New Order Received</h2>
          <p style="color: #555;">Hello,</p>
          <p>A new order has been placed by <strong>${userDetails.name}</strong>.</p>
    
          <h3 style="color: #333;">Customer Details:</h3>
          <p><strong>Name:</strong> ${userDetails.name}</p>
          <p><strong>Email:</strong> ${userDetails.email}</p>
          <p><strong>Phone:</strong> ${userDetails.phone}</p>
    
          <h3 style="color: #333;">Order Summary:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd;">Item</th>
                <th style="text-align: center; padding: 10px; border-bottom: 2px solid #ddd;">Quantity</th>
                <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${cartItems.map(item => `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
                  <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
                  <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">₹${item.price}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
    
          <div style="margin-top: 20px; text-align: right;">
            <h3 style="color: #4CAF50;">Total Amount Paid: ₹${totalAmount}</h3>
          </div>
    
          <p style="margin-top: 20px; color: #555;">Please process the order accordingly.</p>
    
          <div style="margin-top: 20px; text-align: center; padding: 15px; font-size: 12px; color: #999;">
            <p>For any queries, contact us at support@akileshstore.com</p>
            <p>&copy; 2025 Akilesh Store. All rights reserved.</p>
          </div>
        </div>
      `
    };
    

    // Send emails
    //  await transporter.sendMail(customerMailOptions);
    //  console.log(`Email sent to customer: ${userDetails.email}`);

    //  await transporter.sendMail(ownerMailOptions);
    //  console.log("Email sent to store owner: seelaikaari123@gmail.com");

    res.status(201).json({ success: true, message: "Order stored, email sent to customer & owner!", order: newOrder });
  } catch (error) {
    console.error("Error during payment verification:", error);
    res.status(500).json({ success: false, message: "Failed to store order.", error: error.message });
  }
};


const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const token = await getShipRocketToken(); // Ensure we have a valid token

    // API URL for getting order details (order status)
    const orderStatusUrl = `https://apiv2.shiprocket.in/v1/external/orders/${orderId}`;

    // Get order status and other details
    const orderStatusResponse = await axios.get(orderStatusUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    const orderStatus = orderStatusResponse.data.data.status;
    const shippingCharges = orderStatusResponse.data.data.shipping_charges;
    const packageCharges = orderStatusResponse.data.data.package_charges;
    const totalAmount = orderStatusResponse.data.data.total_amount;

    let refundAmount = totalAmount;

    // Refund calculation based on order status
    if (orderStatus !== 'Pickup Scheduled') {
      // If the order has been picked up, deduct the shipping and packaging charges
      refundAmount = totalAmount - shippingCharges - packageCharges;
      console.log(`Refund after deduction: ${refundAmount}`);
    } else {
      // If the order is before pickup, full refund is applicable
      console.log(`Full refund: ${totalAmount}`);
    }

    // API URL for canceling the order
    const apiUrl = `https://apiv2.shiprocket.in/v1/external/cancel/order`;  

    // The request body with order ID and refund amount
    const requestBody = {
      order_id: orderId,
      refund_amount: refundAmount
    };

    // Send POST request to cancel the order
    const cancelResponse = await axios.post(apiUrl, requestBody, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    // Handle the response
    if (cancelResponse.data.status === 'success') {
      res.status(201).json(`Order ${orderId} successfully canceled with refund amount: ${refundAmount}`);
    } else {
      res.status(500).json(`Failed to cancel order ${orderId}: ${cancelResponse.data.message}`);
    }
  } catch (error) {
    console.error("Error while canceling order:", error);
    res.status(500).json('Error while canceling order:', error);
  }
};

const getOrdersdetails=async (req, res) => {
  const { userId }=req.body;

  try{
    const result= await orderModel.getOrderByUserId(userId)
    
    if(result){
      res.status(200).json({data:result})
    }else{
      res.status(400).json({data:result,err:"no orders found!"})
    }
  }catch(err){
    res.status(500).json({data:result,err:"error fetching data!"})
  }

}

module.exports = { createRazorpayOrder, getOrdersdetails,verifyPaymentAndCreateOrder,cancelOrder};
