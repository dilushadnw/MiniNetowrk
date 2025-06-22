import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Get user by ID (public profile)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(404).json({ msg: 'User not found' });
  }
});

// Update profile (name, bio, profilePic)
router.put('/me', auth, upload.single('profilePic'), async (req, res) => {
  try {
    const updates = {};
    if (req.body.username) updates.username = req.body.username;
    if (req.body.bio) updates.bio = req.body.bio;
    if (req.file) updates.profilePic = '/uploads/' + req.file.filename;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(400).json({ msg: 'Update failed' });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(404).json({ msg: 'User not found' });
  }
});

export default router;