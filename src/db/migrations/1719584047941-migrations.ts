import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1719584047941 implements MigrationInterface {
  name = 'Migrations1719584047941';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`product\` ADD \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`product\` DROP COLUMN \`createdAt\``,
    );
  }
}
