export type UserRole = "admin" | "manager" | "employee" | "user";

export interface UserSafe {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
}
export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

export interface JWTPayload {
  sub: string;
  email?: string;
  role?: UserRole;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: { id: string; email?: string; role?: UserRole };
    }
  }

  namespace NodeJS {
    namespace NodeJS {
      interface ProcessEnv {
        NODE_ENV?: "development" | "test" | "production";
        PORT?: string;
        JWT_SECRET: string;
        MONGODB_URI?: string;
        NEXTAUTH_SECRET?: string;
        NEXTAUTH_URL?: string;
      }
    }
  }
}

export {};
