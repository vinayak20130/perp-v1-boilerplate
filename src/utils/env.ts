import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error("Environment Variable is not defined");
  }
  return value;
}

export const envs = {
  port: Number(process.env.PORT ?? "3000"),
  database_url: requireEnv("DATABASE_URL"),
  redis_url: requireEnv("REDIS_URL"),
  jwt_secret: requireEnv("JWT_SECRET"),
};
