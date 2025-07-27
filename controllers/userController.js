import { uploadToS3, deleteFromS3 } from '../utils/s3Upload.js';
import { generateAvatarUrl } from '../utils/avatar.js';
import User from '../models/user.js';

// Get current user's profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Search users by name or username
export const searchUsers = async (req, res) => {
  const { q } = req.query;
  try {
    const users = await User.find({
      $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } }
      ]
    }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Edit user's profile
export const editProfile = async (req, res) => {
  const userId = req.user.id;
  const { fullName, username } = req.body;

  let updateData = {};

  if (fullName) {
    updateData.fullName = fullName;
  }

  if (username) {
    // Check if username is unique
    const exists = await User.findOne({ username, _id: { $ne: userId } });
    if (exists) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    updateData.username = username;
  }

  const user = await User.findById(userId);

  if (req.file) {
    // Delete previous profile pic from S3 if exists
    if (user.profilePic) {
      await deleteFromS3(user.profilePic);
    }
    // Upload new profile pic to S3
    const profilePicUrl = await uploadToS3(req.file);
    updateData.profilePic = profilePicUrl;
  } else if (fullName && !user.profilePic) {
    // Only set avatar if user didn't have a profilePic before
    updateData.profilePic = generateAvatarUrl(fullName);
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
  res.json({ message: 'Profile updated', user: updatedUser });
};