import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';



const s3 = new S3Client({
  region: process.env.AWS_REGION
  // Remove credentials block to let SDK auto-resolve from env
});

export const uploadToS3 = async (file) => {
  const fileExt = file.originalname.split('.').pop();
  const fileName = `profile-pics/${uuidv4()}.${fileExt}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  const response = await s3.send(new PutObjectCommand(params));
//   console.log('S3 upload response:', response);

  // Return public URL
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};

export const deleteFromS3 = async (fileUrl) => {
  if (!fileUrl) return;
  // Extract the key from the URL
  const keyMatch = fileUrl.match(/profile-pics\/.+$/);
  const key = keyMatch ? keyMatch[0] : null;
  if (!key) return;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key
  };

  try {
    await s3.send(new DeleteObjectCommand(params));
  } catch (err) {
    console.error('Error deleting old profile pic from S3:', err);
  }
};

export const uploadFileToS3 = async (file) => {
  const fileExt = file.originalname.split('.').pop();
  const fileName = `chat-files/${uuidv4()}.${fileExt}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  await s3.send(new PutObjectCommand(params));
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};