import redisClient from "../utils/redis";
import dbClient from "../utils/db";
import FilesManager from "../utils/files";

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers["x-token"];
    if (!token) return res.status(401).send({ error: "Unauthorized" });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: "Unauthorized" });

    const { name } = req.body;
    if (!name) return res.status(400).send({ error: "Missing name" });

    const { type, parentId } = req.body;
    if (!type || (type !== "folder" && type !== "file" && type !== "image"))
      return res.status(400).send({ error: "Missing type" });

    if (parentId) {
      const parent = await dbClient.getFiles(parentId);
      if (!parent) return res.status(400).send({ error: "Parent not found" });

      if (parent.type !== "folder")
        return res.status(400).send({ error: "Parent is not a folder" });
    }

    const { data, isPublic } = req.body;
    if (!data && type !== "folder")
      return res.status(400).send({ error: "Missing data" });

    if (type === "folder") {
      const result = await dbClient.createFile(
        name,
        type,
        userId,
        parentId,
        isPublic,
      );
      return res.status(201).send(result);
    } else {
      const localPath = FilesManager.createFile(data);
      const result = await dbClient.createFile(
        name,
        type,
        userId,
        parentId,
        isPublic,
        localPath,
      );
      return res.status(201).send(result);
    }
  }
}

export default FilesController;