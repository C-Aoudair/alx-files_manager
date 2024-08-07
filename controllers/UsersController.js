import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import Bull from 'bull';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    try {
      const userExists = await dbClient.isUserExist(email);
      if (userExists) return res.status(400).json({ error: 'User already exists' });

      const newUser = await dbClient.createUser(email, password);

      const producer = new Bull('userQueue');
      await producer.add({ userId: newUser.id });

      return res.status(201).json(newUser);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create user' });
    }
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const key = `auth_${token}`;
    try {
      const userId = await redisClient.get(key);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const user = await dbClient.getUserById(userId);
      return res.status(200).json({ id: user.id, email: user.email });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve user' });
    }
  }
}

export default UsersController;
