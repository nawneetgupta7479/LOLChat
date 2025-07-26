import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import User from '../models/user.js';
import GiphyApi from 'giphy-api';
import { uploadFileToS3 } from '../utils/s3Upload.js';
import { getFileHash } from '../utils/hashFile.js';
import File from '../models/File.js';

const giphy = GiphyApi({ apiKey: process.env.GIPHY_API_KEY });

export const sendMessage = async (req, res) => {
  const { chatId, text, gifUrl } = req.body;
  const senderId = req.user.id;

  let attachments = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const hash = getFileHash(file.buffer);

      // Check for duplicate file by hash
      let dbFile = await File.findOne({ hash });
      let url, type;

      if (dbFile) {
        // File already exists, use existing URL
        url = dbFile.fileUrl;
        type = dbFile.fileName.endsWith('.mp4') ? 'video'
             : dbFile.fileName.match(/\.(jpg|jpeg|png|gif)$/i) ? 'image'
             : 'file';

        // Update uploadedBy and usedInChats if needed
        if (!dbFile.uploadedBy.includes(senderId)) dbFile.uploadedBy.push(senderId);
        if (!dbFile.usedInChats.includes(chatId)) dbFile.usedInChats.push(chatId);
        await dbFile.save();
      } else {
        // New file, upload to S3
        url = await uploadFileToS3(file);
        type = file.mimetype.startsWith('image/') ? 'image'
             : file.mimetype.startsWith('video/') ? 'video'
             : 'file';

        dbFile = await File.create({
          hash,
          fileName: file.originalname,
          fileUrl: url,
          uploadedBy: [senderId],
          usedInChats: [chatId]
        });
      }

      attachments.push({
        url,
        type,
        name: file.originalname,
        size: file.size
      });
    }
  }

  const message = await Message.create({
    chat: chatId,
    sender: senderId,
    text,
    gifUrl,
    attachments
  });

  // Update chat's last message
  await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

  // Add message reference to user
  await User.findByIdAndUpdate(senderId, { $push: { messages: message._id } });

  res.status(201).json(message);
};

export const getChatMessages = async (req, res) => {
  const { chatId } = req.params;
  const messages = await Message.find({ chat: chatId }).populate('sender', 'fullName username profilePic');
  res.json(messages);
};

export const searchGifs = async (req, res) => {
  const { q } = req.query;
  try {
    const response = await giphy.search({ q, rating: 'pg', limit: 10 });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching GIFs' });
  }
};