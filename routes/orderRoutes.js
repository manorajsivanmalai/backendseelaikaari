const express = require("express");
const { createRazorpayOrder, verifyPaymentAndCreateOrder, getRazorpayKey,cancelOrder } = require("../controllers/orderController");

const router = express.Router();

router.post("/create-razorpay-order", createRazorpayOrder);
router.post("/verify-payment", verifyPaymentAndCreateOrder);
router.get("/get-razorpay-key", getRazorpayKey);
router.post("/cancelOrder",cancelOrder);

module.exports = router;
