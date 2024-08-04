import { MongoClient, ObjectId } from "mongodb";
import sha1 from "sha1";

class DBClient {
  constructor() {
    this.isConnected = false;
    this.host = process.env.DB_HOST || "localhost";
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || "files_manager";
    this.client = new MongoClient(`mongodb://${this.host}:${this.port}`, {
      useUnifiedTopology: true,
    });

    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      this.isConnected = true;
    } catch (error) {
      console.log(error);
    }
  }

  isAlive() {
    return this.isConnected;
  }

  getCollection(collectionName) {
    return this.client.db(this.database).collection(collectionName);
  }

  async countDocuments(collectionName) {
    return this.getCollection(collectionName).countDocuments();
  }

  async findOne(collectionName, query) {
    return this.getCollection(collectionName).findOne(query);
  }

  async insertOne(collectionName, document) {
    return this.getCollection(collectionName).insertOne(document);
  }

  nbUsers() {
    return this.countDocuments("users");
  }

  nbFiles() {
    return this.countDocuments("files");
  }

  isUserExist(email) {
    return this.findOne("users", { email });
  }

  async createUser(email, password) {
    const result = await this.insertOne("users", {
      email,
      password: sha1(password),
    });
    return { id: result.insertedId, email };
  }

  getUser(email) {
    return this.findOne("users", { email });
  }

  getUserById(userId) {
    return this.findOne("users", { _id: new ObjectId(userId) });
  }

  getFile(fileId) {
    return this.findOne("files", { _id: new ObjectId(fileId) });
  }

  async getFilesForUser(userId, parentId) {
    const query = {
      userId: new ObjectId(userId),
      parentId: parentId === "0" ? "0" : new ObjectId(parentId),
    };
    const files = await this.getCollection("files").find(query).toArray();
    return files;
  }

  async getPageFilesForUser(userId, parentId, page) {
    const query = {
      userId: new ObjectId(userId),
      parentId: parentId === "0" ? "0" : new ObjectId(parentId),
    };
    const files = await this.getCollection("files")
      .find(query)
      .skip(page * 20)
      .limit(20)
      .toArray();
    return files;
  }

  async createFile(name, type, userId, parentId = "0", isPublic = false) {
    const fileData = {
      name,
      type,
      userId: new ObjectId(userId),
      parentId: parentId === "0" ? "0" : new ObjectId(parentId),
      isPublic,
    };
    const result = await this.insertOne("files", fileData);
    return { id: result.insertedId, ...fileData };
  }
}

const dbClient = new DBClient();
export default dbClient;
