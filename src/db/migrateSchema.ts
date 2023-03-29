import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const migrateSchema = async () => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const migrationsClient = postgres(process.env.PG_DB_URL!, {
    max: 1,
  });
  const db = drizzle(migrationsClient);

  await migrate(db, { migrationsFolder: "./migrations" });
};

void migrateSchema()
  .then(() => process.exit(0))
  .catch((ex) => {
    console.error(ex);
    process.exit(1);
  });
