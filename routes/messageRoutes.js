import express from 'express';
import multer from 'multer';
import { sendMessage, getChatMessages, searchGifs } from '../controllers/messageController.js';
import { authenticateUser } from '../middlewares/authMiddleware.js';

const router = express.Router();
const upload = multer(); // memory storage

router.post('/', authenticateUser, upload.array('attachments'), sendMessage);
router.get('/:chatId', authenticateUser, getChatMessages);
router.get('/search-gifs', authenticateUser, searchGifs);

export default router;