import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCarFundContributionDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999999)
  amount: number;

  @IsOptional()
  @IsDateString()
  contributedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
