const DEFAULT_JWT_SECRET = "dev-secret-fallback";

function getJwtSecret() {
  return process.env.JWT_SECRET?.trim() || process.env.JWT_SECRET_KEY?.trim() || DEFAULT_JWT_SECRET;
}

module.exports = { getJwtSecret };
