import type { Request, Response, NextFunction } from "express";
import jwt, {
  JwtPayload,
  TokenExpiredError,
  JsonWebTokenError,
} from "jsonwebtoken";

export interface AuthTokenPayload extends JwtPayload {
  id?: string;
  sub?: string;
  email?: string;
  role?: string;
}

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
    user?: { id: string; email?: string; role?: string };
  }
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  const cookieToken = (req as any).cookies?.access_token;
  if (cookieToken) return cookieToken;

  const xToken = req.headers["x-access-token"];
  if (typeof xToken === "string") return xToken;

  return null;
}

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ message: "No token provided" });

    const raw = jwt.verify(token, JWT_SECRET) as string | JwtPayload;

    if (typeof raw === "string") {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const payload = raw as AuthTokenPayload;
    const userId = payload.id ?? payload.sub;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Token missing user id (sub/id)" });
    }

    req.userId = userId;
    req.user = { id: userId, email: payload.email, role: payload.role };

    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }
    if (err instanceof JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: insufficient permissions" });
    }
    next();
  };
};
