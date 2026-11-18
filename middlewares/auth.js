import jwt from "jsonwebtoken";

const auth = async (request, response, next) => {
  try {
    const token =
      request.cookies?.accessToken ||
      request.headers?.authorization?.split(" ")[1];

    if (!token || token === "undefined" || token === "null") {
      return response.status(401).json({
        message: "Provide token",
        error: true,
        success: false,
      });
    }

    const decode = jwt.verify(token, process.env.SECRET_KEY_ACESS_TOKEN);

    if (!decode) {
      return response.status(401).json({
        message: "Unauthorized access",
        error: true,
        success: false,
      });
    }

    request.userId = decode.id;
    next();
  } catch (error) {
    console.log("Auth error:", error.message);
    return response.status(401).json({
      message: "You have not login or token expired",
      error: true,
      success: false,
    });
  }
};

export default auth;