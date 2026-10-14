export const ACCOUNT_TYPES = ['personal', 'fleet'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const CURRENT_TERMS_VERSION = '2026-10-01';
//Values should be changed whenever the legal text changes

/** Usernames that can't be used during registration */
export const RESERVED_USERNAMES = new Set<string>([
    'admin',
    'administrator',
    'root',
    'support',
    'help',
    'system',
    'staff',
    'moderator',
    'security',
    'billing',
    'owner',
    'fleet',
    'api',
    'auth',
    'login',
    'signup',
    'register',
    'me',
    'null',
    'undefined',
    'autochronicle',
    'auto_chronicle',
]);