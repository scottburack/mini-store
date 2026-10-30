import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // CLI only (migrate, db pull, studio): session pooler / direct connection
    url: env('DIRECT_URL'),
  },
});
