const express = require('express');
const { registerUser, loginUser,sendVerification,verifyCode,validateToken,userdetails,updateUser,resetPassword,forgotPasswordLink} = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post("/sendverification",sendVerification);
router.post("/verify",verifyCode);
router.post("/validate-token",validateToken);
router.post("/forgot-password",forgotPasswordLink);
router.post("/reset-password",resetPassword);

router.get('/profile', authenticateToken, (req, res) => {
  res.status(200).json({ message: `Welcome, User ID: ${req.user.id}` });
});

router.get('/user-details', authenticateToken,userdetails);

router.put('/update-user', authenticateToken,updateUser);

module.exports = router;
