import { MongoClient } from "mongodb";

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
}

const dbClient = new DBClient();
export default dbClient;
