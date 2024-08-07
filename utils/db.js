import { MongoClient, ObjectId } from 'mongodb';
import sha1 from 'sha1';

class DBClient {
  constructor() {
    if (DBClient.instance) {
      return DBClient.instance;
    }

    this.isConnected = false;
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(`mongodb://${this.host}:${this.port}`, {
      useUnifiedTopology: true,
    });

    this.connect();
    DBClient.instance = this;
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('DBClient connected');
      this.isConnected = true;
    } catch (error) {
      console.error('Error connecting to database:', error);
      this.isConnected = false;
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

  async nbUsers() {
    return this.countDocuments('users');
  }

  async nbFiles() {
    return this.countDocuments('files');
  }

  async isUserExist(email) {
    return this.findOne('users', { email });
  }

  async createUser(email, password) {
    const result = await this.insertOne('users', {
      email,
      password: sha1(password),
    });
    return { id: result.insertedId, email };
  }

  async getUser(email) {
    return this.findOne('users', { email });
  }

  async getUserById(userId) {
    return this.findOne('users', { _id: new ObjectId(userId) });
  }

  async getFile(fileId) {
    return this.findOne('files', { _id: new ObjectId(fileId) });
  }

  async getFileForUser(userId, fileId) {
    const query = {
      _id: new ObjectId(fileId),
      userId: new ObjectId(userId),
    };
    return this.findOne('files', query);
  }

  async getFilesForUser(userId, parentId) {
    const query = {
      userId: new ObjectId(userId),
      parentId: parentId === '0' ? '0' : new ObjectId(parentId),
    };
    const files = await this.getCollection('files').find(query).toArray();
    return files.map(file => ({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    }));
  }

  async getPageFilesForUser(userId, parentId, page) {
    const query = {
      userId: new ObjectId(userId),
      parentId: parentId === '0' ? '0' : new ObjectId(parentId),
    };
    const files = await this.getCollection('files')
      .find(query)
      .skip(page * 20)
      .limit(20)
      .toArray();
    return files.map(file => ({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    }));
  }

  async createFile(fileInfo) {
    const fileData = {
      name: fileInfo.name,
      type: fileInfo.type,
      userId: new ObjectId(fileInfo.userId),
      parentId: fileInfo.parentId === '0' ? '0' : new ObjectId(fileInfo.parentId),
      isPublic: fileInfo.isPublic,
      localPath: fileInfo.localPath,
    };
    const result = await this.insertOne('files', fileData);
    return {
      id: result.insertedId.toString(),
      userId: fileInfo.userId,
      name: fileInfo.name,
      type: fileInfo.type,
      isPublic: fileInfo.isPublic,
      parentId: fileInfo.parentId,
    };
  }

  async publishFile(fileId) {
    const query = { _id: new ObjectId(fileId) };
    const newValues = { $set: { isPublic: true } };
    await this.getCollection('files').updateOne(query, newValues);
    return this.getFile(fileId);
  }

  async unPublishFile(fileId) {
    const query = { _id: new ObjectId(fileId) };
    const newValues = { $set: { isPublic: false } };
    await this.getCollection('files').updateOne(query, newValues);
    return this.getFile(fileId);
  }
}

const dbClient = new DBClient();
export default dbClient;
