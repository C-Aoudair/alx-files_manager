import Bull from 'bull';
import { promises as fs } from 'fs';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';

const fileQueueConsumer = new Bull('fileQueue');
const userQueueConsumer = new Bull('userQueue');

// Process file thumbnail creation
fileQueueConsumer.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId || !userId) throw new Error('Missing fileId or userId');

  const file = await dbClient.getFileForUser(userId, fileId);
  if (!file) throw new Error('File not found');

  try {
    const bufferData = await fs.readFile(file.localPath);
    const sizes = [500, 250, 100];

    // Create thumbnails asynchronously
    await Promise.all(sizes.map(async (size) => {
      const imageData = await imageThumbnail(bufferData, { width: size });
      await fs.writeFile(`${file.localPath}_${size}`, imageData);
      console.log(`Thumbnail created with size ${size}`);
    }));
  } catch (error) {
    console.error('Error processing file thumbnail:', error);
  }
});

// Process user queue jobs
userQueueConsumer.process(async (job) => {
  const { userId } = job.data;

  if (!userId) throw new Error('Missing userId');

  const user = await dbClient.getUserById(userId);
  if (!user) throw new Error('User not found');

  console.log(`Welcome ${user.email}`);
});
