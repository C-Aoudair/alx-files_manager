import { promises as fs, existsSync } from "fs";
import { v4 as uuidv4 } from "uuid";

export class FilesManager {
  static path = process.env.FOLDER_PATH || "/tmp/files_manager";

  static async createFile(data, path = null) {
    const filePath = path || `${FilesManager.path}/${uuidv4()}`;

    if (existsSync(filePath)) {
      return { error: "File already exists" };
    }

    const bufferData = Buffer.from(data, "base64");

    try {
      await fs.writeFile(filePath, bufferData);
      return filePath;
    } catch (error) {
      return { error: "Failed to create the file" };
    }
  }

  static async readFile(filePath) {
    if (!existsSync(filePath)) {
      return { error: "File does not exist" };
    }
    try {
      const bufferData = await fs.readFile(filePath);
      return bufferData;
    } catch (error) {
      return { error: "Cannot read the file" };
    }
  }
}
