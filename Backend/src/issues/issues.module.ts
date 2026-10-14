import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { VehicleAccessService } from './vehicle-access.service';

@Module({
    controllers: [IssuesController],
    providers: [IssuesService, VehicleAccessService],
})
export class IssuesModule {}
