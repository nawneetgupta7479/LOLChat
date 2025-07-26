import express from 'express';
import multer from 'multer';
import { getProfile, searchUsers, editProfile } from '../controllers/userController.js';
import { authenticateUser } from '../middlewares/authMiddleware.js';

const router = express.Router();
const upload = multer(); // memory storage

router.get('/me', authenticateUser, getProfile);
router.get('/search', authenticateUser, searchUsers);
router.put('/editProfile', authenticateUser, upload.single('profilePic'), editProfile);

export default router;