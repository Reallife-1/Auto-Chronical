import {
  Equals,
  IsBoolean,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AcceptFleetInvitationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @IsString()
  @Matches(/^[a-fA-F0-9]{64}$/)
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;

  @IsBoolean()
  @Equals(true, { message: 'You must accept the terms and privacy policy' })
  acceptedTerms: boolean;
}
