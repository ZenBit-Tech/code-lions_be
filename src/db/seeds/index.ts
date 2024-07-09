import { DataSource } from 'typeorm';

import dataSource from 'src/db/data-source';
import { Seeder, runSeeder } from 'typeorm-extension';

import ColorSeeder from './color.seeder';

class SeedRunner implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    await dataSource.initialize();
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0;');
    await dataSource.query('TRUNCATE TABLE colors;');
    await dataSource.query('TRUNCATE TABLE products;');

    await runSeeder(dataSource, ColorSeeder);

    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1;');
    await dataSource.destroy();
  }
}

const seedRunner = new SeedRunner();

seedRunner.run(dataSource);
