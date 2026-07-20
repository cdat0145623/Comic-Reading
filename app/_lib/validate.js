import { z } from "zod";

const FormRatingValidate = z.object({
    character: z.string(),
    plot: z.string(),
    world: z.string(),
    content: z
        .string()
        .min(1, { message: "Nội dung không được để trống" })
        .refine(
            (val) => {
                const worldCount = val.trim().split(/\s+/).length;
                return worldCount >= 100;
            },
            {
                message: "Nội dung phải có ít nhất 100 từ",
            }
        ),
});

const FormCommentValidate = z.object({
    content: z
        .string()
        .min(1, { message: "Nội dung không được để trống" })
        .refine(
            (val) => {
                const worldCount = val.trim().split(/\s+/).length;
                return worldCount >= 3;
            },
            {
                message: "Nội dung phải có ít nhất 3 từ",
            }
        ),
});

const SignUpSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email({ message: "Email không hợp lệ" }),
    password: z
        .string()
        .trim()
        .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" })
        .regex(/^(?=.*[A-Z]).+$/, {
            message: "Mật khẩu cần ít nhất một chữ in hoa",
        })
        .regex(/[0-9]/, { message: "Mật khẩu cần ít nhất một chữ số" }),
});

const SignInSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email({ message: "Email không hợp lệ" }),
    password: z.string().min(1, { message: "Bạn chưa nhập mật khẩu" }),
});

const PasswordSchema = z
    .string()
    .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
    .regex(/[A-Z]/, { message: "Mật khẩu cần ít nhất một chữ in hoa" })
    .regex(/[0-9]/, { message: "Mật khẩu cần ít nhất một chữ số" });

const ResetPasswordSchema = z.object({
    token: z.string().min(32),
    password: PasswordSchema,
});

const ChangeEmailSchema = z.object({
    email: z.string().trim().toLowerCase().email({ message: "Email không hợp lệ" }),
    currentPassword: z.string().min(1, { message: "Bạn chưa nhập mật khẩu hiện tại" }),
});

const ChangePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, { message: "Bạn chưa nhập mật khẩu hiện tại" }),
        password: PasswordSchema,
        confirmPassword: z.string().min(1, { message: "Bạn chưa xác nhận mật khẩu mới" }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Mật khẩu xác nhận không khớp",
        path: ["confirmPassword"],
    });

export {
    FormRatingValidate,
    SignInSchema,
    SignUpSchema,
    ResetPasswordSchema,
    ChangeEmailSchema,
    ChangePasswordSchema,
    FormCommentValidate,
};
