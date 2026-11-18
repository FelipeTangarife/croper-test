import { randomBytes } from 'node:crypto';
import { isEmail } from 'class-validator';
import type { UsersService } from '../users/users.service.js';

const MIN_PASSWORD_LENGTH = 8;
const GENERATED_PASSWORD_BYTES = 24;
const DEFAULT_ADMIN_NAME = 'Admin';

export interface AdminSeedConfig {
  email?: string;
  name?: string;
  password?: string;
}

export type AdminSeedResult =
  | { status: 'created'; email: string; generatedPassword?: string }
  | { status: 'exists'; email: string };

interface ValidAdminConfig {
  email: string;
  name: string;
  password?: string;
}

function validateConfig({
  email,
  name,
  password,
}: AdminSeedConfig): ValidAdminConfig {
  const trimmedEmail = email?.trim().toLowerCase();
  if (!trimmedEmail) throw new Error('SEED_ADMIN_EMAIL is required');
  if (!isEmail(trimmedEmail)) {
    throw new Error('SEED_ADMIN_EMAIL must be a valid email');
  }

  const adminName = name?.trim() || DEFAULT_ADMIN_NAME;
  if (adminName.length < 2 || adminName.length > 100) {
    throw new Error('SEED_ADMIN_NAME must be between 2 and 100 characters');
  }

  if (password && password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `SEED_ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  return {
    email: trimmedEmail,
    name: adminName,
    password: password || undefined,
  };
}

export async function seedAdmin(
  usersService: UsersService,
  config: AdminSeedConfig,
): Promise<AdminSeedResult> {
  const { email, name, password } = validateConfig(config);

  if (await usersService.findByEmail(email)) {
    return { status: 'exists', email };
  }

  const adminPassword =
    password ?? randomBytes(GENERATED_PASSWORD_BYTES).toString('base64url');
  await usersService.create({ email, name, password: adminPassword });

  return password
    ? { status: 'created', email }
    : { status: 'created', email, generatedPassword: adminPassword };
}
