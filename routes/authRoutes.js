import express from 'express';
import multer from 'multer';
import {
  sendOtp,
  verifyOtp,
  completeProfile,
  logout
} from '../controllers/authController.js';

const router = express.Router();
const upload = multer(); // memory storage

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/complete-profile', upload.single('profilePic'), completeProfile);
router.post('/logout', logout);

export default router;
