import User from '../models/user.js';
import Otp from '../models/Otp.js';
import generateOTP from '../utils/generateOtp.js';
import sendEmail from '../utils/sendMail.js';
import jwt from 'jsonwebtoken';
import { uploadToS3 } from '../utils/s3Upload.js';
import { generateAvatarUrl } from '../utils/avatar.js';

export const sendOtp = async (req, res) => {
  const { email } = req.body;
  const otp = generateOTP();
  await Otp.create({ email, otp });
  await sendEmail(email, otp);
  res.status(200).json({ message: 'OTP sent' });
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const existing = await Otp.findOne({ email, otp });
  if (!existing) return res.status(400).json({ message: 'Invalid or expired OTP' });

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, isVerified: true });
  } else {
    user.isVerified = true;
    await user.save();
  }
  await Otp.deleteMany({ email });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  if (user.fullName) {
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    return res.status(200).json({
      message: 'OTP verified',
      userExists: true,
      user,
      token
    });
  } else {
    // Don't set token, require profile completion
    return res.status(200).json({
      message: 'OTP verified, please complete profile',
      userExists: false,
      user
    });
  }
};

export const completeProfile = async (req, res) => {
  const { email, fullName } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'User not found' });

  let base = fullName.trim().toLowerCase().replace(/\s+/g, '');
  let username = base;
  let count = 1;
  while (await User.findOne({ username })) {
    username = `${base}${count}`;
    count++;
  }

  let profilePicUrl = '';
  if (req.file) {
    profilePicUrl = await uploadToS3(req.file);
  } else {
    profilePicUrl = generateAvatarUrl(fullName);
  }

  user.fullName = fullName;
  user.profilePic = profilePicUrl;
  user.username = username;
  await user.save();

  // After updating user.fullName
  if (user.fullName) {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    return res.status(200).json({ message: 'Profile completed', user, token });
  } else {
    return res.status(400).json({ message: 'Full name is required' });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

export const checkEmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    return res.json({ exists: true, message: 'Email already exists' });
  } else {
    return res.json({ exists: false, message: 'Email not found' });
  }
};