import { createClient } from "redis";
import { promisify } from "util";

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on("error", (error) => console.log(error));
    this.asyncGet = promisify(this.client.get).bind(this.client);
    this.asyncSetEx = promisify(this.client.setex).bind(this.client);
    this.asyncDel = promisify(this.client.del).bind(this.client);
  }

  isAlive = () => this.client.connected;
  get = (key) => this.asyncGet(key);
  set = (key, value, duration) => this.asyncSetEx(key, duration, value);
  del = (key) => this.asyncDel(key);
}

const redisClient = new RedisClient();
export default redisClient;
