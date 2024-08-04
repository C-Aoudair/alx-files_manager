import sha1 from "sha1";
import dbClient from "../utils/db";
import redisClient from "../utils/redis";

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).send({ error: "Missing email" });
    if (!password) return res.status(400).send({ error: "Missing password" });

    const user = await dbClient.isUserExist(email);
    if (user) return res.status(400).send({ error: "Already exist" });

    const result = await dbClient.createUser(email, password);
    return res.status(201).send(result);
  }

  static async getMe(req, res) {
    const token = req.headers["x-token"];
    if (!token) return res.status(401).send({ error: "Unauthorized" });

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) return res.status(401).send({ error: "Unauthorized" });

    const user = await dbClient.getUserById(userId);
    return res.status(200).send({ id: user.id, email: user.email });
  }
  
}

export default UsersController;
