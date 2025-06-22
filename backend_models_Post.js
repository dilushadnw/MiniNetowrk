import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  image: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Post', postSchema);