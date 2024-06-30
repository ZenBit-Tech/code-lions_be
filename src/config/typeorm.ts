import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

import { dataSourceOptions } from 'src/db/data-source';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor() {}
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return dataSourceOptions;
  }
}
