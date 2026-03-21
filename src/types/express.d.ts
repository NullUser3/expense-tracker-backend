import { User } from "./models.js";
import type { RequestUser } from "../middleware/protect.ts";
import type { JwtPayload } from "../middleware/protect.ts";

declare global {
  namespace Express {
    interface Request {
      user: RequestUser;
      token:JwtPayload;
    }
  }
}