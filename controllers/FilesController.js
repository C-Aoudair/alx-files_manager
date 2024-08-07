import mime from 'mime-types';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { FilesManager } from '../utils/files';
import Bull from 'bull';

class FilesController {
  static async validateToken(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    return userId;
  }

  static async postUpload(req, res) {
    const userId = await FilesController.validateToken(req, res);
    if (!userId) return;

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
      const producer = new Bull('fileQueue');
      await producer.add({ fileId: result.id, userId: result.userId });
    }
    return res.status(201).json(result);
  }

  static async getShow(req, res) {
    const userId = await FilesController.validateToken(req, res);
    if (!userId) return;

    const { id } = req.params;
    const file = await dbClient.getFileForUser(userId, id);
    if (!file) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const userId = await FilesController.validateToken(req, res);
    if (!userId) return;

    const parentId = req.query.parentId || '0';
    const { page } = req.query;

    const files = page
      ? await dbClient.getPageFilesForUser(userId, parentId, page)
      : await dbClient.getFilesForUser(userId, parentId);

    return res.status(200).json(files);
  }

  static async putPublish(req, res) {
    const userId = await FilesController.validateToken(req, res);
    if (!userId) return;

    const { id } = req.params;
    const file = await dbClient.getFileForUser(userId, id);
    if (!file) return res.status(404).json({ error: 'Not found' });

    const result = await dbClient.publishFile(id);
    return res.status(200).json(result);
  }

  static async putUnpublish(req, res) {
    const userId = await FilesController.validateToken(req, res);
    if (!userId) return;

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

    if (!file.isPublic && file.userId.toString() !== userId) return res.status(403).json({ error: 'Forbidden' });

    if (file.type === 'folder') return res.status(400).json({ error: "A folder doesn't have content" });
    
    let filePath = file.localPath;
    const { size } = req.query;

    if (size && ['250', '500', '100'].includes(size)) {
      filePath = `${file.localPath}_${size}`;
    }

    const bufferData = await FilesManager.readFile(filePath);
    if (bufferData === -1) return res.status(404).json({ error: 'Not found' });

    return res.status(200).type(mime.lookup(file.name)).send(bufferData);
  }
}

export default FilesController;
