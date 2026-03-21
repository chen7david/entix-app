import { authClient } from "./web/src/lib/auth-client";
// Since we don't have an auth session, we can't easily reproduce it via curl without a valid token.
// Let's just instantiate the internal Hono service directly and see if it throws.
import { SessionScheduleService } from "./api/services/session-schedule.service";
import { SessionScheduleRepository } from "./api/repositories/session-schedule.repository";
import { nanoid } from "nanoid";

console.log("Imports parsed successfully.");
