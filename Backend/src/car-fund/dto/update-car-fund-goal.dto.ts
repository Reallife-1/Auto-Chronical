import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export const CONTRIBUTION_CADENCES = ['daily', 'weekly', 'monthly'] as const;
export type ContributionCadence = (typeof CONTRIBUTION_CADENCES)[number];

export class UpdateCarFundGoalDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999999)
  targetAmount: number;

  @IsString()
  @Length(3, 3)
  currency: string;

  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  targetDate?: string | null;

  @IsOptional()
  @IsIn([...CONTRIBUTION_CADENCES])
  contributionCadence?: ContributionCadence | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999999)
  plannedContributionAmount?: number | null;

  @IsOptional()
  @IsBoolean()
  remindersEnabled?: boolean;
}
