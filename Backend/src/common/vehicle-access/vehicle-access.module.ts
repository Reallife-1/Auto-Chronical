import { Module } from '@nestjs/common';
import { VehicleAccessService } from './vehicle-access.service';

@Module({
  providers: [VehicleAccessService],

})
export class VehicleAccessModule {}