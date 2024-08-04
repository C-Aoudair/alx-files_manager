import { promises as fs, existsSync } from "fs";
import { v4 as uuidv4 } from "uuid";

class FilesManager {
  static path = process.env.FOLDER_PATH || "/tmp/files_manager";

  static async createFile(data) {
    const filePath = `${FilesManager.path}/${uuidv4()}`;

    if (existsSync(filePath)) {
      return { error: "File already exists" };
    }

    const bufferData = Buffer.from(data, "base64").toString("utf-8");

    await fs.writeFile(filePath, bufferData);

    return { filePath };
  }

  static paginate(file, page) {
    const limit = 20;
    const start = page * limit;
    const end = start + limit;

    return file.slice(start, end);
  }
}

export default FilesManager;
