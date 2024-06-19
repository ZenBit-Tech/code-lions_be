import { Module } from '@nestjs/common';

import { GeoNamesController } from './geoNames.controller';
import { GeoNamesService } from './geoNames.service';

@Module({
  controllers: [GeoNamesController],
  providers: [GeoNamesService],
})
export class GeoNamesModule {}
