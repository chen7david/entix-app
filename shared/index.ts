import { z } from "zod";

export const SHARED_GREETING = "Hello from shared code!";

export const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
});

export type UserDTO = z.infer<typeof userSchema>;
