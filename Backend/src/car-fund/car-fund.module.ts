import { Module } from '@nestjs/common';
import { CarFundController } from './car-fund.controller';
import { CarFundService } from './car-fund.service';

@Module({
  controllers: [CarFundController],
  providers: [CarFundService],
  exports: [CarFundService],
})
export class CarFundModule {}
