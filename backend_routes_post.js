import express from 'express';
import Post from '../models/Post.js';
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

// Create post
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const post = new Post({
      author: req.user.id,
      text: req.body.text,
      image: req.file ? '/uploads/' + req.file.filename : ""
    });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(400).json({ msg: 'Post failed' });
  }
});

// Get all posts (feed)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate('author', 'username profilePic')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(400).json({ msg: 'Failed to get posts' });
  }
});

// Get posts by user
router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'username profilePic')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(400).json({ msg: 'Failed to get posts' });
  }
});

export default router;