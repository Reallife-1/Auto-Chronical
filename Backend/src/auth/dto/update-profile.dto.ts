import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { normalizePhone } from '../../common/utils/phone';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,20}$/, {
    message:
      'Username must be 3-20 characters and contain only letters, numbers, or underscores.',
  })
  username?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizePhone(value) : value,
  )
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message:
      'Phone number must be in international format, e.g. +2348000000000',
  })
  phone?: string;
}