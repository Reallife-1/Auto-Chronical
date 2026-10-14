import { UnauthorizedException } from "@nestjs/common";

export function bearerToken(authorization?: string): string {
    const token = authorization?.startsWith('Bearer ')
        ? authorization.slice(7).trim()
        : '';
    if (!token) {
        throw new UnauthorizedException('Authorization token is required');
    }
    return token;
}