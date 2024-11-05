import Joi from "joi";

// Định nghĩa DTO cho yêu cầu đổi mật khẩu
export interface ChangePasswordRequestDto {
  oldPassword: string;
  newPassword: string;
}

// Schema validation cho yêu cầu đổi mật khẩu
const ChangePasswordRequestSchema = Joi.object<ChangePasswordRequestDto>({
  oldPassword: Joi.string().required().messages({
    "any.required": "Mật khẩu cũ là bắt buộc!",
    "string.empty": "Mật khẩu cũ không được để trống!",
  }),
  newPassword: Joi.string()
    .min(8)
    .max(50)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
      )
    )
    .required()
    .messages({
      "string.min": "Mật khẩu mới phải có ít nhất 8 ký tự!",
      "string.max": "Mật khẩu mới không được vượt quá 50 ký tự!",
      "string.pattern.base":
        "Mật khẩu mới phải chứa ít nhất một chữ cái viết hoa, một chữ cái viết thường, một số và một ký tự đặc biệt!",
      "any.required": "Mật khẩu mới là bắt buộc!",
      "string.empty": "Mật khẩu mới không được để trống!",
    }),
});

// Xuất schema
export default ChangePasswordRequestSchema;
