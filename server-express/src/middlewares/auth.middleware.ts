import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ERR_INTERNAL_SERVER_ERROR, ERR_UNAUTHORIED } from "../config/constant";

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // B1: Kiểm tra xem có truyền token không
    const bearerToken = req.headers.authorization;
    console.log("Bearer Token:", bearerToken);

    // Tách token từ header
    const token = bearerToken?.split(" ")[1]; // Sử dụng optional chaining để kiểm tra
    console.log("Extracted Token:", token);

    if (!token) {
      return res
        .status(401)
        .json({
          status: false,
          error: ERR_UNAUTHORIED,
          message: "Token not provided",
        });
    }

    // B2: Kiểm tra token này có hợp lệ hay không
    const SECRET_KEY = process.env.JWT_SECRET || "";
    console.log("SECRET_KEY auth:", SECRET_KEY);

    // Kiểm tra token hợp lệ và lấy payload
    let payloadJson;
    try {
      payloadJson = jwt.verify(token, SECRET_KEY);
      console.log("Decoded Payload:", payloadJson); // Log payload đã giải mã
    } catch (err) {
      console.error("Token verification error:", err); // Log lỗi
      return res.status(401).json({
        status: false,
        error: ERR_UNAUTHORIED,
        message: "Token Invalid!",
      });
    }

    // Lưu thông tin user vào res.locals để sử dụng ở các middleware và route sau
    res.locals.userData = payloadJson;

    // Tiếp tục đến middleware hoặc route tiếp theo
    next();
  } catch (err) {
    console.error("Internal server error:", err); // Log lỗi hệ thống
    return res
      .status(500)
      .json({ status: false, error: ERR_INTERNAL_SERVER_ERROR });
  }
};

export default authMiddleware;
