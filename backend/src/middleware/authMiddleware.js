// Demo auth middleware — in production, verify Supabase JWT
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  // Demo mode: token is the user ID
  req.userId = token;
  next();
}
