import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from 'postgres';

const migrateSchema = async () => {
  const migrationsClient = postgres("", {
    max: 1,
  });
  const db = drizzle(migrationsClient);

  await migrate(db, { migrationsFolder: "./src/db/migrations" });
};

void migrateSchema()
  .then(() => process.exit(0))
  .catch((ex) => {
    console.error(ex);
    process.exit(1);
  });
