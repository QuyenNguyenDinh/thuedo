import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'apps/backend/.env'),
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
];

for (const p of envPaths) {
  dotenv.config({ path: p });
}

const dbUrl = process.env.DATABASE_URL;
let host = process.env.DB_HOST || 'localhost';
let port = parseInt(process.env.DB_PORT || '5432', 10);
let username = process.env.DB_USERNAME || 'postgres';
let password = process.env.DB_PASSWORD || 'postgres_password_example';
let database = process.env.DB_DATABASE || 'cosrent_db';

if (dbUrl) {
  try {
    const parsed = new URL(dbUrl);
    host = parsed.hostname || host;
    port = parsed.port ? parseInt(parsed.port, 10) : port;
    username = parsed.username || username;
    password = decodeURIComponent(parsed.password || password);
    database = (parsed.pathname ? parsed.pathname.slice(1) : database) || database;
  } catch (e) {
    // fallback to env vars
  }
}

const isCloudDb =
  process.env.DB_SSL === 'true' ||
  (dbUrl &&
    (dbUrl.includes('neon.tech') ||
      dbUrl.includes('supabase.co') ||
      dbUrl.includes('render.com') ||
      dbUrl.includes('railway.app') ||
      dbUrl.includes('aivencloud.com') ||
      dbUrl.includes('aiven.io') ||
      dbUrl.includes('sslmode=require'))) ||
  host.includes('neon.tech') ||
  host.includes('supabase.co') ||
  host.includes('render.com') ||
  host.includes('railway.app') ||
  host.includes('aivencloud.com') ||
  host.includes('aiven.io');

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host,
  port,
  username,
  password,
  database,
  synchronize: false,
  ssl: isCloudDb ? { rejectUnauthorized: false } : false,
  extra: isCloudDb ? { ssl: { rejectUnauthorized: false } } : undefined,
  entities: [path.join(__dirname, '../entities/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],
};

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
