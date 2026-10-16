import { CreateIssueDto } from '../../issues/dto/create-issue.dto';
import { IsUUID } from 'class-validator';

export class CreateDriverReportDto extends CreateIssueDto {}

export class SubmitDriverReportDto extends CreateDriverReportDto {
  @IsUUID()
  vehicleId: string;
}