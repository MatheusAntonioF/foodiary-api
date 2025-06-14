import { z } from "zod";

export const signUpSchema = z.object({
    account: z.object({
        email: z.string().min(1, "Email is required").email("Invalid email"),
        password: z
            .string()
            .min(8, "Password should be at least 8 characters long"),
    }),
});

export type SignUpBody = z.infer<typeof signUpSchema>;
