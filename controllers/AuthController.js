import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const [email, password] = Buffer.from(auth.replace('Basic ', ''), 'base64')
      .toString('utf-8')
      .split(':');

    if (!email || !password) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.getUser(email);
    if (!user || user.password !== sha1(password)) { return res.status(401).json({ error: 'Unauthorized' }); }

    const token = uuidv4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 86400);

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await redisClient.del(`auth_${token}`);
    return res.status(204).send();
  }
}

export default AuthController;
