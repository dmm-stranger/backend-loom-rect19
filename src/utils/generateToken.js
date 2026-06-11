import jwt from "jsonwebtoken";

/**
 * Signs a JWT for the given user id and attaches it to the response
 * as an httpOnly cookie. The token is also returned so the controller
 * can include it in the JSON body (the frontend's authSlice can store
 * it for use as an `Authorization: Bearer <token>` header in
 * RTK Query's baseApi.js prepareHeaders).
 *
 * @param {Object} res - Express response object
 * @param {String} userId - Mongoose document _id
 * @returns {String} the signed JWT
 */
const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

  const cookieExpireDays = Number(process.env.COOKIE_EXPIRE_DAYS) || 7;

  res.cookie("token", token, {
    httpOnly: true, // not accessible via client-side JS (XSS protection)
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: cookieExpireDays * 24 * 60 * 60 * 1000,
  });

  return token;
};

export default generateToken;
