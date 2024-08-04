import sha1 from "sha1";
import dbClient from "../utils/db";
import redisClient from "../utils/redis";

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });
    if (!password) return res.status(400).json({ error: "Missing password" });

    const userExists = await dbClient.isUserExist(email);
    if (userExists) return res.status(400).json({ error: "Already exist" });

    const newUser = await dbClient.createUser(email, password);
    return res.status(201).json(newUser);
  }

  static async getMe(req, res) {
    const token = req.headers["x-token"];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await dbClient.getUserById(userId);
    return res.status(200).json({ id: user.id, email: user.email });
  }
}

export default UsersController;
