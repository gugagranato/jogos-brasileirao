import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const defaultMysqlPort = 3306;

const createAdapter = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const url = new URL(databaseUrl);
  const username = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = url.pathname.replace(/^\/+/, "");
  if (!database) {
    throw new Error("DATABASE_URL must include a database name.");
  }
  const port = url.port ? Number(url.port) : defaultMysqlPort;

  return new PrismaMariaDb({
    host: url.hostname,
    port,
    user: username,
    password,
    database,
  });
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: createAdapter() });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
