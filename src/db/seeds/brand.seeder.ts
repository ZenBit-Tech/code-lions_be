import { DataSource } from 'typeorm';

import { Brand } from 'src/modules/products/entities/brands.entity';
import { Seeder } from 'typeorm-extension';

export default class BrandSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Brand);

    await repository.insert([
      { id: 1, brand: 'Michael Kors' },
      { id: 2, brand: 'Chiara Ferragni' },
      { id: 3, brand: 'Beatrice B' },
      { id: 4, brand: 'Nai Lu-na' },
      { id: 5, brand: 'Marjolaine' },
      { id: 6, brand: 'Luisa Cerano' },
      { id: 7, brand: 'Deni Cler Milano' },
      { id: 8, brand: 'KENZO' },
      { id: 9, brand: 'Andres Sarda' },
      { id: 10, brand: 'Lolita dress' },
      { id: 11, brand: 'Armani Exchange' },
      { id: 12, brand: 'Diesel' },
      { id: 13, brand: 'Clips Tricot' },
      { id: 14, brand: 'Other' },
    ]);
  }
}
