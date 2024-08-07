import { promises as fs, existsSync } from "fs";
import { encode } from "punycode";
import { v4 as uuidv4 } from "uuid";

export class FilesManager {
  static path = process.env.FOLDER_PATH || "/tmp/files_manager";

  static async createFile(data, path = null) {
    const filePath = path || `${FilesManager.path}/${uuidv4()}`;

    if (existsSync(filePath)) {
      return { error: "File already exists" };
    }

    const bufferData = Buffer.from(data, "base64");

    await fs.writeFile(filePath, bufferData);

    return filePath;
  }

  static async readFile(filePath) {
    console.log(" I saw you")
    if (!existsSync(filePath)) {
      return -1;
    }
    try {
      const bufferData = await fs.readFile(filePath);
      console.log("I read the file")
      return bufferData;
    } catch (error) {
      return { error: "Cannot read the file" };
    }
  }
}
