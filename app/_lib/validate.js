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
        .email({ message: "You have to enter a valid Email" }),
    password: z
        .string()
        .trim()
        .min(6, { message: "Be at least 6 chacracters long" })
        .regex(/^(?=.*[A-Z]).+$/, {
            message: "Password have to at least a uppercase character",
        })
        .regex(/[0-9]/, { message: "Password have to at least a number" }),
});

export { FormRatingValidate, SignUpSchema, FormCommentValidate };
