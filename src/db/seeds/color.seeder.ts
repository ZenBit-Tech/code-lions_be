import { Color } from 'src/modules/products/entities/color.entity';
import { colors } from 'src/modules/products/entities/colors.types';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';

export default class ColorSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const colorArray = Object.entries(colors).map(
      ([key, value]: [string, number]) => ({
        id: value,
        color: key,
      }),
    );

    const repository = dataSource.getRepository(Color);

    await repository.insert(colorArray);
  }
}
