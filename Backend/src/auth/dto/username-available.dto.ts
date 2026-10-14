import { Matches } from "class-validator";

export class UsernameAvailableQueryDto {
    @Matches(/^[a-zA-Z][a-zA-Z0-9_]{3,20}$/, {
        message: 'Username must be 3-20 characters and contain only letters, numbers, or underscores.',
    })
    username: string;
}