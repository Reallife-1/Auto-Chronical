import {
    IsEmail,
    IsIn,
    IsNotEmpty,
    IsString,
    MinLength,
    MaxLength,
    Matches,
    Equals,
    IsBoolean,
} from 'class-validator';
import { ACCOUNT_TYPES } from '../auth.constants';
import type { AccountType } from '../auth.constants';
import { Transform } from 'class-transformer';
import { normalizePhone } from '../../common/utils/phone';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    firstName: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    lastName: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @Transform(({ value }) => normalizePhone(value))
    @Matches(/^\+[1-9]\d{7,14}$/,{
        message: 'Phone number must be in international format, e.g.  +2348000000000',
    })
    phone: string;

    @IsString()
    @Matches(/^[a-zA-Z0-9_]{3,20}$/,{
        message: 'Username must be 3-20 characters and contain only letters, numbers, or underscores.',
    })
    username: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    password: string;

    @IsString()
    @IsNotEmpty()
    confirmPassword: string;

    @IsIn([...ACCOUNT_TYPES], {
        message: 'accountType must be either personal or fleet',
    })
    accountType: AccountType;

    @IsBoolean()
    @Equals(true, { message: 'You must accept the terms and privacy policy' })
    acceptedTerms: boolean;
}