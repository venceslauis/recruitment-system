const jwt = require("jsonwebtoken");

/**
 * authenticate - Verifies the JWT Bearer token in the Authorization header.
 * Attaches the decoded payload (id, role) to req.user on success.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  // Support both "Bearer <token>" and raw token formats
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/**
 * requireRole - Role-based access control middleware factory.
 * Must be used AFTER authenticate().
 *
 * Usage: router.post("/route", authenticate, requireRole("issuer"), handler)
 *
 * @param {...string} roles - One or more allowed roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(" or ")}`
      });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };