import dotenv from "dotenv";
dotenv.config();
import express, { NextFunction, Request, Response } from "express";
import validationMiddleware from "./middlewares/validation.middleware";
import LoginRequestSchema, {
  LoginRequestDto,
} from "./validations/LoginRequestSchema";
import RegisterRequestSchema, {
  RegisterRequestDto,
} from "./validations/RegisterRequestSchema";
import db from "./config/database";
import TokenService from "./services/TokenService";
import UserEntity from "./entities/UserEntity";
import bcrypt from "bcrypt";
import authMiddleware from "./middlewares/auth.middleware";
import ProductRepository from "./repositories/ProductRepository";
import ProductEntity from "./entities/ProductEntity";
import CreateProductSchema, {
  CreateProductDto,
} from "./validations/CreateProductRequestSchema";
import { ERR_INTERNAL_SERVER_ERROR } from "./config/constant";
import ChangePasswordRequestSchema, { ChangePasswordRequestDto } from "./validations/ChangePasswordRequestDto";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import cors from "cors"
const app = express();
const port = 3000;

// Sử dụng cors
app.use(cors({
  origin: '*', // Cho phép domain này truy cập
  methods: 'GET,POST,PUT,DELETE', // Các phương thức cho phép
  credentials: true, // Cho phép cookie nếu cần
}));

app.use(express.json());


app.use(express.json());

app.get("/", async (req: Request, res: Response) => {
  console.log(req.query);
  const users = await db.query("SELECT * FROM user");
  res.json(users[0]);
});

app.post(
  "/login",
  validationMiddleware(LoginRequestSchema),
  async (req: Request, res: Response) => {
    // Khai báo kiểu dữ liệu cho request body
    const requestBody: LoginRequestDto = req.body;

    // Tim user có username theo yeu cau
    const result = await db.query(`SELECT * FROM user WHERE username = ?`, [
      requestBody.username,
    ]);
    const users: Array<UserEntity> = result[0] as any;
    // Lấy phần tử đầu tiên tìm được
    console.log("users", users);
    // Kiểm tra xem user này có tồn tại hay không
    const user = users[0];
    if (!user) {
      return res.status(400).json({ message: "Không tìm thấy user" });
    }

    // Check password có trùng khớp không
    // requestBody.password == user.password
    const checkPassword = await bcrypt.compare(
      requestBody.password,
      user.password
    );
    if (!checkPassword) {
      return res.status(400).json({ message: "Password sai!" });
    }

    // Tạo token
    const tokenService = new TokenService();
    const token = tokenService.generateToken({
      username: user.username,
      phone_number: user.phone_number,
      address: user.address,
    });
    return res.json({ token });
  }
);

app.post(
  "/register",
  validationMiddleware(RegisterRequestSchema),
  async (req: Request, res: Response) => {
    const requestBody: RegisterRequestDto = req.body;

    try {
      // Check if the username already exists
      const existingUser = await db.query(
        `SELECT * FROM user WHERE username = ?`,
        [requestBody.username]
      );
      const users: Array<UserEntity> = existingUser[0] as any;

      // If a user exists, return an error
      if (users.length > 0) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash the password before storing it
      const hashedPassword = await bcrypt.hash(requestBody.password, 10);

      // Insert the new user into the database
      await db.query(
        `INSERT INTO user (username, password, phone_number, address) VALUES (?, ?, ?, ?)`,
        [
          requestBody.username,
          hashedPassword, // Store the hashed password
          requestBody.phone_number,
          requestBody.address,
        ]
      );

      // Return success message along with the token
      return res.status(201).json({ status: true });
    } catch (error) {
      console.error(error); // Log the error for debugging purposes
      return res.status(500).json({ message: "Error during registration" });
    }
  }
);

app.get("/info", authMiddleware, async (req: Request, res: Response) => {
  const username = res.locals.userData.username;
  // Tim user có username theo yeu cau
  const result = await db.query(`SELECT * FROM user WHERE username = ?`, [
    username,
  ]);
  const users: Array<UserEntity> = result[0] as any;
  // Lấy phần tử đầu tiên tìm được
  console.log("users", users);
  // Kiểm tra xem user này có tồn tại hay không
  const user = users[0];

  return res.status(200).json({ status: true, userData: user });
});

// api tạo product app.post("/product/create"
app.post(
  "/product/create",
  authMiddleware,
  validationMiddleware(CreateProductSchema),
  async (req: Request, res: Response) => {
    try {
      const reqBody: CreateProductDto = req.body;
      const { name, price, categoryId, factoryId } = reqBody;
      const connection = await db.getConnection();
      const productRepository = new ProductRepository(connection);
      await productRepository.createProduct(name, price, categoryId, factoryId);
      connection.release();
      return res.status(201).json({ status: true });
    } catch (err) {
      return res
        .status(500)
        .json({ status: false, error: ERR_INTERNAL_SERVER_ERROR });
    }
  }
);

// api update product app.post("/product/update"

// api get tất cả products app.get("/product/list"
app.get("/product/list", async (req: Request, res: Response) => {
  try {
    const size = req.query?.size as string;
    const page = req.query?.page as string;
    const connection = await db.getConnection();
    const productRepository = new ProductRepository(connection);
    const products = await productRepository.selectProducts(size, page);
    connection.release();
    return res.status(200).json(products);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ status: false, error: ERR_INTERNAL_SERVER_ERROR });
  }
});

app.post(
  "/change-password",
  authMiddleware,
  validationMiddleware(ChangePasswordRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const { oldPassword, newPassword }: ChangePasswordRequestDto = req.body;
      const username = res.locals.userData.username;

      // Lấy thông tin người dùng từ cơ sở dữ liệu
      const [users]: [RowDataPacket[], any] = await db.query(
        `SELECT * FROM user WHERE username = ?`,
        [username]
      );

      const user = users[0];

      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      // Kiểm tra mật khẩu cũ
      const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordMatch) {
        return res.status(400).json({ message: "Mật khẩu cũ không đúng!" });
      }

      // Mã hóa mật khẩu mới và cập nhật vào cơ sở dữ liệu
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const [updateResult]: [ResultSetHeader, any] = await db.query(
        `UPDATE user SET password = ? WHERE username = ?`,
        [hashedNewPassword, username]
      );

      if (updateResult.affectedRows === 0) {
        return res.status(400).json({ message: "Không thể cập nhật mật khẩu" });
      }

      return res
        .status(200)
        .json({ status: true, message: "Đổi mật khẩu thành công!" });
    } catch (error) {
      console.error("Error changing password:", error);
      return res
        .status(500)
        .json({ status: false, message: "Có lỗi xảy ra khi đổi mật khẩu" });
    }
  }
);











// api get detail product app.get("/product/{id}"

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
