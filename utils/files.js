import { promises as fs, existsSync } from "fs";
import { v4 as uuidv4 } from "uuid";

export class FilesManager {
  static path = process.env.FOLDER_PATH || "/tmp/files_manager";

  static async createFile(data) {
    const filePath = `${FilesManager.path}/${uuidv4()}`;

    if (existsSync(filePath)) {
      return { error: "File already exists" };
    }

    const bufferData = Buffer.from(data, "base64").toString("utf-8");

    await fs.writeFile(filePath, bufferData);

    return filePath;
  }

  static async readFile(fileId) {
    const filePath = `${FilesManager.path}/${fileId}`;
    if (!existsSync(filePath)) {
      return -1;
    }
    try {
      const data = await fs.readFile(filePath);
      return { data };
    } catch (error) {
      return { error: "Cannot read the file" };
    }
  }
}
