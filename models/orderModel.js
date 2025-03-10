const db = require('../config/db'); // Your database connection file
const axios = require('axios');
// Create a new order
const createOrder = async (orderData) => {
  const {
    order_id, customer_name, email, phone, address, city, state, payment_id, signature, country, pincode,
    payment_method, shipping_charges, total_amount, weight,
    shipment_id = null, awb_code = null, courier_name = null, order_status = 'pending',user
  } = orderData;

 
  const query = `
    INSERT INTO orders (
      order_id, customer_name, email, phone, address, city, state, payment_id, signature,country, pincode, 
      payment_method, shipping_charges, total_amount, weight, 
      shipment_id, awb_code, courier_name, order_status, created_at, updated_at,user_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11, $12, $13, $14, $15, $16,$17,$18, $19, NOW(), NOW(),$20)
  `;

  const values = [
    order_id, customer_name, email, phone, address, city, state, payment_id, signature,country, pincode,
    payment_method, shipping_charges, total_amount, weight, 
    shipment_id, awb_code, courier_name, order_status,user
  ];

  try {
    const result = await db.query(query, values);
    return result.rows; // Returns the result of the insert query
  } catch (err) {
    console.error("Error during order creation:", err);
    throw err; // Propagate the error
  }
};

// Function to create order items
const createOrderItem = async (orderItemData) => {
  const { order_id, product_id, quantity, price, total_amount } = orderItemData;

  const query = `
    INSERT INTO order_items (order_id, product_id, quantity, price, total_amount)
    VALUES ($1, $2, $3, $4, $5)
  `;

  const values = [order_id, product_id, quantity, price, total_amount];

  const result = await db.query(query, values);
  return result.rows; // Returns the result of the insert query
};

// Update order details after shipping (like shipment_id, awb_code, courier_name, order_status)
const updateOrder = async (orderId, updateFields) => {
  const {
    shipment_id, awb_code, courier_name, order_status
  } = updateFields;
  
  try {
    const result = await db.query(
      `UPDATE orders SET shipment_id = $1, awb_code = $2, courier_name = $3, order_status = $4 
      WHERE order_id = $5`,
      [shipment_id, awb_code, courier_name, order_status, orderId]
    );
    return result.rows;
  } catch (err) {
    console.error("Error updating order:", err);
    throw err;
  }
};

// Get order by order_id (used for tracking)
const getOrderByUserId = async (userId) => {
  try {
    const result = await db.query(`
      SELECT 
        orders.order_id, orders.total_amount,
        orders.order_status,orders.shipment_id,orders.payment_id,orders.address,
        products.name
      FROM 
        orders
      INNER JOIN 
        order_items ON orders.id = order_items.order_id
      INNER JOIN  
        products ON order_items.product_id = products.id
      WHERE 
        orders.user_id = $1
    `, [userId]);
  
    
    return result.rows;
  } catch (err) {
    console.error("Error fetching order:", err);
    throw err;
  }
};
const formatDate = (date) => {
  let d = new Date(date);
  let year = d.getFullYear();
  let month = ('0' + (d.getMonth() + 1)).slice(-2); // Months are 0-indexed
  let day = ('0' + d.getDate()).slice(-2);
  let hours = ('0' + d.getHours()).slice(-2);
  let minutes = ('0' + d.getMinutes()).slice(-2);

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}



const createShipRocketOrder = async (order, token) => {

    try {
      const response = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
        {
         
            "order_id": order.order_id,
            "order_date": formatDate(new Date()),
            "pickup_location": "warehouse",
            "channel_id": "",
            "comment": "Reseller: M/s Goku",
            "billing_customer_name": order.customer_name,
            "billing_last_name": "",
            "billing_address": order.address,
            "billing_address_2": "Near Hokage House",
            "billing_city":order.city,
            "billing_pincode":order.pincode,
            "billing_state":order.state,
            "billing_country":order.country,
            "billing_email": order.email,
            "billing_phone": order.phone,
            "shipping_is_billing": true,
            "shipping_customer_name": "",
            "shipping_last_name": "",
            "shipping_address": "",
            "shipping_address_2": "",
            "shipping_city": "",
            "shipping_pincode": "",
            "shipping_country": "",
            "shipping_state": "",
            "shipping_email": "",
            "shipping_phone": "",
            "order_items": order.order_items.map((item,index) => ({
              name: item.name,
              units: item.quantity,
              sku:item.sku || `TSHIRT002${index}`,
              selling_price: parseInt(item.price),
              discount: item.discount || 0,
              tax: item.tax || 0,
              hsn: item.hsn || 0,
            })),
            "payment_method":order.payment_method || "Prepaid",
            "shipping_charges": 0,
            "giftwrap_charges": 0,
            "transaction_charges": 0,
            "total_discount": 0,
            "sub_total": 9000,
            "length": order.length|| 10,
            "breadth":  order.breadth || 5,
            "height":  order.height || 5,
            "weight":  order.weight || 0.5
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    
    
  
      const shipmentID = response.data.shipment_id;
      console.log('ShipRocket Order Created:', shipmentID);
  
      // Store the shipment ID in your database
      await saveTracking(order.order_id, shipmentID);
    } catch (error) {
      console.error('Error creating ShipRocket order:', error);
    }
  };
  
  const saveTracking = async (orderID, shipmentID) => {
    try {
      // Update the order with the shipment ID in your database
      await db.query('UPDATE orders SET shipment_id = $1 WHERE order_id = $2', [shipmentID, orderID]);
      console.log('Tracking ID saved successfully!');
    } catch (error) {
      console.error('Error saving tracking ID:', error);
    }
  };
  
module.exports = { createOrder, updateOrder, getOrderByUserId,createShipRocketOrder,saveTracking,createOrderItem};
