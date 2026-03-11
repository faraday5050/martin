import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "quench-mart-secret-key-2024";

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

export const checkSecurityKey = (req: any, res: any, next: any) => {
  const securityKey = req.headers['x-inventory-key'];
  const masterKey = process.env.INVENTORY_SECURITY_KEY || "quench-vault-2026";
  
  if (securityKey !== masterKey) {
    return res.status(403).json({ error: "Invalid inventory security key" });
  }
  next();
};
