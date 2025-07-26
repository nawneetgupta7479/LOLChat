import User from '../models/user.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import File from '../models/File.js';
import { deleteFromS3 } from '../utils/s3Upload.js';

// Send a friend request
export const sendFriendRequest = async (req, res) => {
  const { userId } = req.body; // user to follow
  const currentUserId = req.user.id;

  if (userId === currentUserId) return res.status(400).json({ message: "You can't follow yourself" });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Prevent duplicate requests or already friends
  if (user.friendRequests.includes(currentUserId) || user.friends.includes(currentUserId)) {
    return res.status(400).json({ message: "Already requested or friends" });
  }

  user.friendRequests.push(currentUserId);
  await user.save();

  // Real-time: Notify user of new request
  req.io.to(userId).emit('friendRequestReceived', { from: currentUserId });

  res.json({ message: "Friend request sent" });
};

// Accept a friend request
export const acceptFriendRequest = async (req, res) => {
  const { userId } = req.body; // user who sent the request
  const currentUserId = req.user.id;

  const user = await User.findById(currentUserId);
  if (!user.friendRequests.includes(userId)) {
    return res.status(400).json({ message: "No such friend request" });
  }

  // Add each other as friends
  user.friends.push(userId);
  user.friendRequests = user.friendRequests.filter(id => id.toString() !== userId);
  await user.save();

  const otherUser = await User.findById(userId);
  otherUser.friends.push(currentUserId);
  await otherUser.save();

  // Real-time: Notify both users
  req.io.to(userId).emit('friendRequestAccepted', { from: currentUserId });
  req.io.to(currentUserId).emit('friendRequestAccepted', { from: userId });

  res.json({ message: "Friend request accepted" });
};

// Get all users (for left section)
export const getAllUsers = async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user.id } }).select('fullName username profilePic');
  res.json(users);
};

// Get friends (for middle section)
export const getFriends = async (req, res) => {
  const user = await User.findById(req.user.id).populate('friends', 'fullName username profilePic');
  res.json(user.friends);
};

// Get previous chats (for right section)
export const getPreviousChats = async (req, res) => {
  const user = await User.findById(req.user.id).populate({
    path: 'chats',
    populate: { path: 'members', select: 'fullName username profilePic' }
  });
  res.json(user.chats);
};

export const unfriend = async (req, res) => {
  const currentUserId = req.user.id;
  const { userId } = req.body; // friend to disconnect

  // Remove each other from friends list
  await User.findByIdAndUpdate(currentUserId, { $pull: { friends: userId } });
  await User.findByIdAndUpdate(userId, { $pull: { friends: currentUserId } });

  // Find the chat between these two users
  const chat = await Chat.findOne({ members: { $all: [currentUserId, userId] }, members: { $size: 2 } });
  if (chat) {
    // Delete all messages in this chat
    const messages = await Message.find({ chat: chat._id });

    // For each message, check attachments
    for (const msg of messages) {
      for (const att of msg.attachments) {
        // Find the file in File collection
        const fileDoc = await File.findOne({ fileUrl: att.url });
        if (fileDoc) {
          // Remove this chat from usedInChats
          fileDoc.usedInChats.pull(chat._id);
          // Remove this user from uploadedBy if needed
          fileDoc.uploadedBy.pull(currentUserId);
          fileDoc.uploadedBy.pull(userId);
          await fileDoc.save();

          // If file is not used in any other chat and not uploaded by anyone else, delete from S3 and DB
          if (fileDoc.usedInChats.length === 0 && fileDoc.uploadedBy.length === 0) {
            await deleteFromS3(fileDoc.fileUrl);
            await File.deleteOne({ _id: fileDoc._id });
          }
        }
      }
    }

    // Delete messages and chat
    await Message.deleteMany({ chat: chat._id });
    await Chat.deleteOne({ _id: chat._id });

    // Remove chat reference from both users
    await User.findByIdAndUpdate(currentUserId, { $pull: { chats: chat._id } });
    await User.findByIdAndUpdate(userId, { $pull: { chats: chat._id } });
  }

  res.json({ message: 'Unfriended and chat/files cleaned up.' });
};