const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { log } = require('console');
const db = require('../config/db');
const { use } = require('../routes/userRoutes');
let verificationTokens = {}; 

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
const generateVerificationCode = () => {
  const characters = '0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters[randomIndex];
  }
  return code;
};

const sendVerification = async (req, res) => {
  const { name, email } = req.body;


  const existingUser = await userModel.getUserByEmail(email);

  if(existingUser){
    return res.status(400).json({
      message: 'Email already registered'
    });
  }
  // Generate a unique verification token
  const token = generateVerificationCode();
  const expirationTime = Date.now() + 2 * 60 * 1000; // 2 minutes

  // Store token with expiration
  verificationTokens[token] = { email, expirationTime };

  // Send verification email
  try {
    await transporter.sendMail({
      from:  process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Seelaikaari Saree - Email Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f7f7f7;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background-color: #6a1b9a; /* Purple color for brand identity */
            color: #ffffff;
            padding: 25px;
            text-align: center;
        }
        .email-header h1 {
            margin: 0;
            font-size: 26px;
            font-weight: bold;
        }
        .email-body {
            padding: 25px;
            color: #333333;
            text-align: center;
        }
        .email-body h3 {
            margin-top: 0;
            font-size: 22px;
            color: #6a1b9a; /* Purple color for consistency */
        }
        .email-body p {
            font-size: 16px;
            line-height: 1.6;
            margin: 10px 0;
        }
        .email-body h5.verify-button {
            display: inline-block;
            margin: 25px 0;
            padding: 12px 30px;
            background-color: #ff4081; /* Pink color for the button */
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        .email-body h5.verify-button:hover {
            background-color: #e91e63; /* Darker pink on hover */
        }
        .email-footer {
            background-color: #f4f4f4;
            padding: 15px;
            text-align: center;
            font-size: 14px;
            color: #666666;
        }
        .email-footer p {
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Welcome to Seelaikaari Saree!</h1>
        </div>
        <div class="email-body">
           <h3>Hi ${name || "there!"},</h3>
   <p>Thank you for creating an account with Seelaikaari Saree. To get started, please verify your email address using the verification code below:</p>  
   <h5 class="verify-button">${token}</h3>
   <p>Enter this code on the website to complete your verification.</p>
            <p>This link will expire in <strong>2 minutes</strong>, so please verify your email soon.</p>
        </div>
        <div class="email-footer">
            <p>Seelaikaari Saree - Bringing Tradition to Your Doorstep</p>
            <p>Contact us: support@seelaikaarisaree.com</p>
        </div>
    </div>
</body>
</html>
      `,
    });

    res.status(200).json({ message: 'Verification email sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending verification email.' });
  } 
};

// Verify token and complete registration

const verifyCode = (req, res) => {
  const { email, code } = req.body;
  const storedToken = verificationTokens[code];
  
  if (!storedToken) {
    return res.status(400).json({ error: "No verification code found for this email." });
  }

  if (Date.now() > storedToken.expirationTime) {
    delete verificationTokens[email];
    return res.status(400).json({ error: "Verification code expired. Please request a new one." });
  }

  if (storedToken.email !== email) {
    return res.status(400).json({ error: "Invalid verification code." });
  }

  delete verificationTokens[code]; // Remove after successful verification
  res.status(200).json({ message: "Email verified successfully!" });
};




const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, isgauth } = req.body;
    
    
    const existingUser = await userModel.getUserByEmail(email);
     
     
    if (existingUser) {
      const userId1=existingUser.id;
      const email1=existingUser.email

      const token1 = jwt.sign({ id: userId1, email:email1 }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY,
      });
      return res.status(isgauth ? 200 : 400).json({
        data: existingUser.id,
        error: 'Email already registered',
        token:isgauth ?token1:null
      });
    }

    const hashedPassword = password ? password : null;
    const userId = await userModel.createUser({ name, email, phone, password: hashedPassword });
    
    // Generate JWT Token for verification or session
    const token = jwt.sign(
      { id:userId.id, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token:  token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const validateToken = (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    res.status(200).json({ user });
  });
};
const userdetails= async (req, res) => {
  try {
    const userId = req.user.id;
   
    const user = await userModel.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      id: user[0].id,
      name: user[0].name,
      email: user[0].email,
      phone: user[0].phone,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

const updateUser= async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone } = req.body;

    // Fetch the existing user details
    const existingUser = await userModel.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare updated fields
    const updatedFields = {
      name: name || existingUser.name,
      email: email || existingUser.email,
      phone: phone || existingUser.phone,
    };

  
    // Update the user in the database
    const updatedUser = await userModel.updateUserById(userId, updatedFields);

    res.status(200).json({
      message: 'User details updated successfully',
      user: {
        id: updatedUser[0].id,
        name: updatedUser[0].name,
        email: updatedUser[0].email,
        phone: updatedUser[0].phone,
        createdAt: updatedUser[0].createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

const forgotPasswordLink =async (req,res)=>{
  const { email } = req.body;
  
  
const existingUser = await userModel.getUserByEmail(email);

if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // Token valid for 1 hour

    await db.query("UPDATE users SET reset_token = ?, token_exp = ? WHERE email = ?", [token, expiry, email]);

    const resetLink = `${process.env.FrontEnd}reset-password?token=${token}`;


    await transporter.sendMail({
        from:  process.env.EMAIL_USER,
        to: email,
        subject: "Reset Your Password",
        html: `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - Seelaikaari Saree</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .email-container {
                    max-width: 600px;
                    margin: 20px auto;
                    background: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .logo {
                    text-align: center;
                    padding-bottom: 10px;
                }
                .logo img {
                    width: 150px;
                }
                .email-content {
                    text-align: center;
                }
                h2 {
                    color: #333;
                }
                p {
                    font-size: 16px;
                    color: #555;
                    line-height: 1.6;
                }
                .reset-button {
                    display: inline-block;
                    padding: 12px 20px;
                    font-size: 16px;
                    color: #fff;
                    background-color: #d81b60;
                    text-decoration: none;
                    border-radius: 5px;
                    margin-top: 20px;
                }
                .reset-button:hover {
                    background-color: #b71850;
                }
                .footer {
                    margin-top: 20px;
                    text-align: center;
                    font-size: 14px;
                    color: #888;
                }
                .footer a {
                    color: #d81b60;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
        
        <div class="email-container">
            <div class="logo">
                <img src="https://yourwebsite.com/logo.png" alt="Seelaikaari Saree">
            </div>
            
            <div class="email-content">
                <h2>Password Reset Request</h2>
                <p>Hi there,</p>
                <p>We received a request to reset your password for your Seelaikaari Saree account. Click the button below to set a new password.</p>
                <a href="${resetLink}" class="reset-button">Reset Password</a>
                <p>If you didn’t request this, please ignore this email. This link will expire in 15 minutes for security reasons.</p>
            </div>
        
            <div class="footer">
                <p>Need help? Contact us at <a href="mailto:support@seelaikaarisaree.com">support@seelaikaarisaree.com</a></p>
                <p>Seelaikaari Saree - Bringing Tradition to Your Doorstep</p>
            </div>
        </div>
        
        </body>
        </html>
        `,
    });

    res.status(200).json({ message: "Password reset link sent to your email" });
}

const resetPassword = async (req, res) => {
  try {
      const { token, newPassword } = req.body;

      // Check if token exists in the database and is not expired
      const [users] = await db.query("SELECT id FROM users WHERE reset_token = ? AND token_exp > NOW()", [token]);

      if (users.length === 0) {
          return res.status(400).json({ message: "Invalid or expired token" });
      }

      const userId = users[0].id; // Extract user ID

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password
      const [result] = await db.execute(
          "UPDATE users SET password = ?, reset_token = NULL, token_exp = NULL WHERE id = ?",
          [hashedPassword, userId]
      );

      if (result.affectedRows === 0) {
          return res.status(500).json({ message: "Password reset failed" });
      }

      res.json({ message: "Password reset successful" });
  } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Internal server error" });
  }
};


module.exports = { registerUser, loginUser,sendVerification,verifyCode,validateToken,userdetails,updateUser,resetPassword,forgotPasswordLink};
