import { join } from 'path';

import { ConfigService } from '@nestjs/config';

import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

config();

const configService = new ConfigService();
const entitiesPaths = join(__dirname, '../', '/**/*.entity.js');

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  entities: [entitiesPaths],
  synchronize: true,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
