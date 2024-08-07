import mime from 'mime-types';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { FilesManager } from '../utils/files';
import Bull from 'bull';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name, type, parentId, data, isPublic,
    } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Invalid type' });

    if (parentId) {
      const parent = await dbClient.getFile(parentId);
      if (!parent) return res.status(400).json({ error: 'Parent not found' });
      if (parent.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

    const fileData = {
      name,
      type,
      userId,
      parentId: parentId || '0',
      isPublic: isPublic || false,
    };

    if (type !== 'folder') {
      const localPath = await FilesManager.createFile(data);
      fileData.localPath = localPath;
    }
    const result = await dbClient.createFile(fileData);
    if (type === 'image') {
      const producer =  new Bull('fileQueue');
      await producer.add({
        fileId: result.id,
        userId: result.userId,
      });
    }
    return res.status(201).json(result);
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const file = await dbClient.getFileForUser(userId, id);
    if (!file) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const parentId = req.query.parentId || '0';
    const { page } = req.query;

    if (page) {
      const pageData = await dbClient.getPageFilesForUser(
        userId,
        parentId,
        page,
      );
      return res.status(200).json(pageData);
    }
    const files = await dbClient.getFilesForUser(userId, parentId);
    return res.status(200).json(files);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const file = await dbClient.getFileForUser(userId, id);
    if (!file) return res.status(404).json({ error: 'Not found' });

    const result = await dbClient.publishFile(id);
    return res.status(200).json(result);
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const file = await dbClient.getFileForUser(userId, id);
    if (!file) return res.status(404).json({ error: 'Not found' });

    const result = await dbClient.unPublishFile(id);
    return res.status(200).json(result);
  }

  static async getFile(req, res) {
    const { id } = req.params;
    const file = await dbClient.getFile(id);
    if (!file) return res.status(404).json({ error: 'Not found' });

    const token = req.headers['x-token'];
    const userId = token ? await redisClient.get(`auth_${token}`) : '0';

    if (!file.isPublic && file.userId.toString() !== userId) return res.status(403).json({ error: 'Not found' });

    if (file.type === 'folder') return res.status(400).json({ error: "A folder doesn't have content" });

    const bufferData = await FilesManager.readFile(file.localPath);
    if (bufferData === -1) return res.status(404).json({ error: 'Not found' });

    return res.status(200).type(mime.lookup(file.name)).send(bufferData);
  }
}

export default FilesController;
