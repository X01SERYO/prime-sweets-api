import 'dotenv/config';
import 'reflect-metadata';
import { TypeOrmDataSource } from './typeOrmDataSource';

export const dataSource = new TypeOrmDataSource();

export default dataSource;
