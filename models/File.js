import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  usedInChats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }],
  createdAt: { type: Date, default: Date.now }
});

const File = mongoose.model('File', fileSchema);
export default File;