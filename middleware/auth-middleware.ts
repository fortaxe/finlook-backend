import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload & { role: string };
}

type AllowedRoles = string | string[];

const authMiddleware = (allowedRoles: AllowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).send("Unauthorized: No token provided");
      return;
    }

    const token = authHeader.split(" ")[1];

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        res.status(500).send("JWT secret not configured");
        return;
      }

      if (!token) {
        res.status(401).send("Unauthorized: No token provided");
        return;
      }

      const decodedRaw = jwt.verify(token as string, jwtSecret);
      // Ensure decodedRaw is an object and has a role property
      if (
        typeof decodedRaw !== "object" ||
        decodedRaw === null ||
        !("role" in decodedRaw) ||
        typeof (decodedRaw as any).role !== "string"
      ) {
        res.status(401).send("Invalid token payload");
        return;
      }

      const decoded = decodedRaw as JwtPayload & { role: string };

      if (!roles.includes(decoded.role)) {
        res.status(403).send("Forbidden: Insufficient permissions");
        return;
      }

      req.user = decoded;
      next(); // ✅ Success — continue
    } catch (error) {
      res.status(401).send("Invalid token");
      return;
    }
  };
};


export default authMiddleware;