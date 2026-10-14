import {
    IsIn, 
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import {
    ISSUE_STATUSES,
} from '../issues.constants';
import type { IssueStatus } from '../issues.constants';

export class UpdateIssueStatusDto {
    @IsIn([...ISSUE_STATUSES], { message: 'status is not a valid issue status' })
    status: IssueStatus;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    note?: string;
}