import Joi from "joi";

export interface ProductRequestDto {
    name: string;
    price: number;
    description?: string;
    stock?: number;
}

const ProductRequestSchema = Joi.object({
    name: Joi.string().required().messages({
        "string.empty": "Tên sản phẩm là bắt buộc.",
    }),
    price: Joi.number().greater(0).required().messages({
        "number.base": "Giá phải là một số.",
        "number.greater": "Giá phải lớn hơn 0.",
    }),
    description: Joi.string().optional(),
    stock: Joi.number().integer().min(0).optional().messages({
        "number.base": "Số lượng phải là một số nguyên.",
        "number.min": "Số lượng không được nhỏ hơn 0.",
    }),
});

export default ProductRequestSchema;
