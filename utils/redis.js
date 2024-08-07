import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    if (RedisClient.instance) {
      return RedisClient.instance;
    }

    this.client = redis.createClient();
    this.connected = false;

    this.client.on('error', (error) => {
      console.error('Redis Client Error:', error);
      this.connected = false;
    });

    this.client.on('ready', () => {
      console.log('Redis Client Connected');
      this.connected = true;
    });

    this.client.on('end', () => {
      console.log('Redis Client Disconnected');
      this.connected = false;
    });

    this.asyncGet = promisify(this.client.get).bind(this.client);
    this.asyncSetEx = promisify(this.client.setex).bind(this.client);
    this.asyncDel = promisify(this.client.del).bind(this.client);

    RedisClient.instance = this;
  }

  isAlive() {
    return this.connected;
  }

  async get(key) {
    try {
      return await this.asyncGet(key);
    } catch (error) {
      console.error('Error getting value:', error);
      throw error;
    }
  }

  async set(key, value, duration) {
    try {
      return await this.asyncSetEx(key, duration, value);
    } catch (error) {
      console.error('Error setting value:', error);
      throw error;
    }
  }

  async del(key) {
    try {
      return await this.asyncDel(key);
    } catch (error) {
      console.error('Error deleting key:', error);
      throw error;
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
