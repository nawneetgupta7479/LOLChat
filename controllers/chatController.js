import Chat from '../models/Chat.js';
import User from '../models/user.js';

export const createChat = async (req, res) => {
  const { userId } = req.body; // user to chat with
  const currentUserId = req.user.id;

  // Check if chat already exists
  let chat = await Chat.findOne({ members: { $all: [currentUserId, userId] } });
  if (chat) return res.json(chat);

  chat = await Chat.create({ members: [currentUserId, userId] });

  // Add chat reference to both users
  await User.findByIdAndUpdate(currentUserId, { $push: { chats: chat._id } });
  await User.findByIdAndUpdate(userId, { $push: { chats: chat._id } });

  res.status(201).json(chat);
};

export const getUserChats = async (req, res) => {
  const chats = await Chat.find({ members: req.user.id }).populate('members', 'fullName username profilePic');
  res.json(chats);
};