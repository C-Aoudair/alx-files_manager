import Bull from 'bull';
import { promises as fs } from 'fs';
import imageThubnail from 'image-thumbnail';
import dbClient from './utils/db';

const consumer = new Bull('fileQueue');

consumer.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const file = await dbClient.getFileForUser(userId, fileId);
  if (!file) throw new Error('File not found');

  try {
    const bufferData = await fs.readFile(file.localPath);
    const sizes = [500, 250, 100];

    sizes.map(async (size) => {
      const imageData = await imageThubnail(bufferData, { width: size });
      await fs.writeFile(`${file.localPath}_${size}`, imageData);
      console.log(`Thubnail created with size ${size}`);
    });
  } catch (error) {
    console.log(error);
  }
});
