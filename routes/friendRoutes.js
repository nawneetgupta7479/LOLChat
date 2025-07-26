import express from 'express';
import {
  sendFriendRequest,
  acceptFriendRequest,
  getAllUsers,
  getFriends,
  getPreviousChats,
  unfriend
} from '../controllers/friendController.js';
import { authenticateUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/all', authenticateUser, getAllUsers);
router.get('/friends', authenticateUser, getFriends);
router.get('/chats', authenticateUser, getPreviousChats);
router.post('/request', authenticateUser, sendFriendRequest);
router.post('/accept', authenticateUser, acceptFriendRequest);
router.post('/unfriend', authenticateUser, unfriend);

export default router;