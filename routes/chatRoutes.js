import express from 'express';
import { createChat, getUserChats } from '../controllers/chatController.js';
import { authenticateUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateUser, createChat);
router.get('/', authenticateUser, getUserChats);

export default router;