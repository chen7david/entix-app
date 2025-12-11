import { z } from "zod";

export const userSchema = z.object({
    name: z.string().min(3, { message: "Username must be at least 3 characters" }).max(255),
    email: z.email({ message: "Invalid email address" }),
});

export const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

export type UserDTO = z.infer<typeof userSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
