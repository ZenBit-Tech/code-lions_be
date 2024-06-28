import { Colors } from 'src/products/entities/colors.enum';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopulateColors1719552500314 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO color (name) VALUES 
        ('${Colors.BLACK}'),
        ('${Colors.BLUE}'),
        ('${Colors.BROWN}'),
        ('${Colors.GREEN}'),
        ('${Colors.GREY}'),
        ('${Colors.ORANGE}'),
        ('${Colors.PINK}'),
        ('${Colors.PURPLE}'),
        ('${Colors.RED}'),
        ('${Colors.WHITE}'),
        ('${Colors.YELLOW}')
      `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM color WHERE name IN (
        '${Colors.BLACK}',
        '${Colors.BLUE}',
        '${Colors.BROWN}',
        '${Colors.GREEN}',
        '${Colors.GREY}',
        '${Colors.ORANGE}',
        '${Colors.PINK}',
        '${Colors.PURPLE}',
        '${Colors.RED}',
        '${Colors.WHITE}',
        '${Colors.YELLOW}'
      )`,
    );
  }
}
