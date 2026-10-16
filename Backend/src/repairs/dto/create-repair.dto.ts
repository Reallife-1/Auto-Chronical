import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsISO4217CurrencyCode,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const MAX_AMOUNT = 9999999999999.99;


export class RepairtPartDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    partName: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(MAX_AMOUNT)
    amount: number;
}

export class CreateRepairDto {
    @IsString()
    @MinLength(1)
    @MaxLength(2000)
    workPerformed: string;

    @IsOptional()
    @IsString()
    @MaxLength(150)
    providerName?: string;

    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
    repairDate: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(MAX_AMOUNT)
    amount: number;

    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
    @IsISO4217CurrencyCode({ message: 'currency must be a valid ISO 4217 currency code' })
    currency: string;

    @IsOptional()
    @IsUUID()
    issueId?: string;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(50)
    @ValidateNested({ each: true }) @Type(() => RepairtPartDto)
    parts?: RepairtPartDto[];
}