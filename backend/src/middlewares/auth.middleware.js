import jwt from "jsonwebtoken";

export const identifyUser = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    const error = new Error("Unauthorized access");
    error.status = 401;
    return next(error);
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    error.status = 401;
    next(error);
  }
};
