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
    this.client
      .connect()
      .then(() => (this.isConnected = true))
      .catch((error) => console.log(error));
  }

  isAlive = () => this.isConnected;

  nbUsers() {
    return this.client.db(this.database).collection("users").countDocuments();
  }

  nbFiles() {
    return this.client.db(this.database).collection("files").countDocuments();
  }

  isUserExist(email) {
    return this.client.db(this.database).collection("users").findOne({ email });
  }

  async createUser(email, password) {
    const result = await this.client
      .db(this.database)
      .collection("users")
      .insertOne({ email, password: sha1(password) });

    return { id: result.insertedId, email };
  }

  async getUser(email) {
    const user = await this.client
      .db(this.database)
      .collection("users")
      .findOne({ email });

    return user;
  }

  async getUserById(userId) {
    const result = await this.client
      .db(this.database)
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    return { id: result._id, email: result.email };
  }

  async getFiles(fileId) {
    const result = await this.client
      .db(this.database)
      .collection("files")
      .findOne({ _id: new ObjectId(fileId) });

    return result;
  }

  async createFile(name, type, userId, parentId = 0, isPublic = false) {
    const result = await this.client
      .db(this.database)
      .collection("files")
      .insertOne({
        name,
        type,
        userId: new ObjectId(userId),
        parentId: new ObjectId(parentId),
        isPublic,
      });

    return { id: result.insertedId, name, type, userId, parentId, isPublic };
  }
}

const dbClient = new DBClient();
export default dbClient;
