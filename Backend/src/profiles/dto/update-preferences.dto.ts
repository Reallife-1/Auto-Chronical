import { Transform } from 'class-transformer';
import {
    IsIn,
    IsISO4217CurrencyCode,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
} from 'class-validator';
import { DISTANCE_UNITS } from '../profile.constants';
import type { DistanceUnit } from '../profile.constants';

//Only the option that is changed will be sent
export class UpdatePreferencesDto {
    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
    @IsISO4217CurrencyCode({ message: 'currency must be a valid ISO 4217 code, e.g. NGN' })
    currency?: string;
    
    //Language tag
    @IsOptional()
    @Transform(({ value }) => {
     if (typeof value !== 'string') return value;
  
      const parts = value.trim().split('-');
      return parts
       .map((part, index) => (index === 0 ? part.toLowerCase() : part.toUpperCase()))
       .join('-');
    })
    @Matches(/^[a-z]{2}(-[A-Z]{2})?$/, {
       message: 'locale must look like en or en-NG',
    })
    locale?: string;

    //IANA timezone, e.g. Africa/Lagos 
    @IsOptional()
    @IsString()
    @MaxLength(64)
    timezone?: string;

    @IsOptional()
    @IsIn([...DISTANCE_UNITS], { message: 'distanceUnit must be km or mi' })
    distanceUnit?: DistanceUnit;

}
