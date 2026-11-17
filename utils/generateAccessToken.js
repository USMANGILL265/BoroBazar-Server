import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
const generateAccessToken = async (userId) => {
  const token = await jwt.sign(
    { id: userId },
    process.env.SECRET_KEY_ACESS_TOKEN,
    { expiresIn: "24h" },
  );
  return token;
};
export default generateAccessToken;
