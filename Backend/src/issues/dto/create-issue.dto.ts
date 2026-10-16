import {
    IsIn,
    IsInt,
    IsISO8601,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';
import {
    ISSUE_CATEGORIES,
    ISSUE_SEVERITIES,
    ISSUE_TIMINGS,
} from '../issues.constants';
import type {
    IssueCategory,
    IssueSeverity,
    IssueTiming,
} from '../issues.constants';

export class CreateIssueDto {
    @IsIn([...ISSUE_CATEGORIES], { message: 'category is not a valid issue category'})
    category: IssueCategory;

    @IsIn([...ISSUE_SEVERITIES], { message: 'severity is not a valid value'})
    severity: IssueSeverity;

    @IsIn([...ISSUE_TIMINGS], { message: 'timing is not a valid value'})
    timing: IssueTiming;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    odometerReading?: number;

    @IsOptional()
    @IsISO8601()
    occurredAt?: string;
    
}