import { z } from "zod";

const messages = {
  required: "This field is required",
};

export const userDto = z.object({
  id: z.string().uuid({ message: "Invalid user ID format" }),
  username: z
    .string({ message: messages.required })
    .min(3, { message: "Username must be at least 3 characters" })
    .max(30, { message: "Username must be at most 30 characters" }),
  email: z.email({ message: "Invalid email address" }),
  name: z.string({ message: messages.required }),
  createdAt: z.date({ message: "Invalid createdAt date" }),
  updatedAt: z.date({ message: "Invalid updatedAt date" }),
});

export const createUserDto = z
  .object({
    username: z
      .string({ message: messages.required })
      .min(3, { message: "Username must be at least 3 characters" })
      .max(30, { message: "Username must be at most 30 characters" }),

    email: z.email({ message: "Invalid email address" }),

    password: z
      .string({ message: messages.required })
      .min(6, { message: "Password must be at least 6 characters" }),

    passwordConfirm: z.string({ message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

export const updateUserDto = z.object({
  email: z.email({ message: "Invalid email address" }).optional(),

  password: z
    .string({ message: messages.required })
    .min(6, { message: "Password must be at least 6 characters" })
    .optional(),
});

export type CreateUserDto = z.infer<typeof createUserDto>;
export type UpdateUserDto = z.infer<typeof updateUserDto>;
export type UserDto = z.infer<typeof userDto>;
