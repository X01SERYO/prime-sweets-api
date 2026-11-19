import 'dotenv/config';
import 'reflect-metadata';
import { TypeOrmDataSource } from './typeOrmDataSource';

const migrationUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

export default new TypeOrmDataSource(migrationUrl);
