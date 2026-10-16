import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { VehicleAccessModule } from '../common/vehicle-access/vehicle-access.module';

@Module({
    imports: [VehicleAccessModule],
    controllers: [IssuesController],
    providers: [IssuesService],
})
export class IssuesModule {}
