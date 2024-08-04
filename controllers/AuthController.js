import dbClient from "../utils/db";
import redisClient from "../utils/redis";
import sha1 from "sha1";
import { v4 as uuidv4 } from "uuid";

class AuthController {
  static async getConnect(req, res) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).send({ error: "Unauthorized" });

    const buff = Buffer.from(auth.replace("Basic ", ""), "base64");
    const creds = buff.toString("utf-8");
    const [email, password] = creds.split(":");
    if (!email || !password)
      return res.status(401).send({ error: "Unauthorized" });

    const user = await dbClient.getUser(email);
    if (!user) return res.status(401).send({ error: "Unauthorized" });

    console.log(user.password, sha1(password));
    if (user.password !== sha1(password))
      return res.status(401).send({ error: "Unauthorized" });

    const token = uuidv4();
    const key = `auth_${token}`;
    const value = user._id;
    await redisClient.set(key, value, 86400);
    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers["x-token"];
    if (!token) return res.status(401).send({ error: "Unauthorized" });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: "Unauthorized" });

    await redisClient.del(`auth_${token}`);
    return res.status(204).send();
  }
}

export default AuthController;
