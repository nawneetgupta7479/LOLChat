import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String },
  gifUrl: { type: String, default: '' },
  attachments: [
    {
      url: String,
      type: String, // 'image', 'video', 'file'
      name: String, // original filename
      size: Number  // in bytes
    }
  ]
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;