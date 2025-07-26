import crypto from 'crypto';

export const getFileHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};