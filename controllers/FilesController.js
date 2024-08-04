import redisClient from "../utils/redis";
import dbClient from "../utils/db";
import FilesManager from "../utils/files";

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers["x-token"];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { name, type, parentId, data, isPublic } = req.body;
    if (!name) return res.status(400).json({ error: "Missing name" });
    if (!type || !["folder", "file", "image"].includes(type))
      return res.status(400).json({ error: "Invalid type" });

    if (parentId) {
      const parent = await dbClient.getFile(parentId);
      if (!parent) return res.status(400).json({ error: "Parent not found" });
      if (parent.type !== "folder")
        return res.status(400).json({ error: "Parent is not a folder" });
    }

    if (type !== "folder" && !data)
      return res.status(400).json({ error: "Missing data" });

    const fileData = {
      name,
      type,
      userId,
      parentId,
      isPublic,
      localPath: type !== "folder" ? FilesManager.createFile(data) : undefined,
    };
    const result = await dbClient.createFile(fileData);
    return res.status(201).json(result);
  }

  static async getShow(req, res) {
    const token = req.headers["x-token"];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    const file = await dbClient.getFileForUser(userId, id);
    if (!file) return res.status(404).json({ error: "Not found" });

    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const token = req.headers["x-token"];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const parentId = req.query.parentId || "0";
    const page = req.query.page;
    
    if (page) {
      const pageData = await dbClient.getPageFilesForUser(userId, parentId, page);
      return res.status(200).json(pageData);
    } else {
      const files = await dbClient.getFilesForUser(userId, parentId);
      return res.status(200).json(files);
    }
  }
}

export default FilesController;
