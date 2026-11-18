import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';

const INVALID_CREDENTIALS_MESSAGE = 'Credenciales inválidas';
const TIMING_SAFE_DUMMY_HASH = bcrypt.hashSync(
  'timing-safe-dummy-password',
  10,
);

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface LoginResult {
  accessToken: string;
  expiresIn: number;
  user: { id: string; email: string; name: string };
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersService) private readonly usersService: UsersService,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.usersService.findByEmail(email);
    const passwordMatches = await bcrypt.compare(
      password,
      user?.password ?? TIMING_SAFE_DUMMY_HASH,
    );
    if (!user || !passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);
    const { iat, exp } = this.jwtService.decode<{ iat: number; exp: number }>(
      accessToken,
    );

    return {
      accessToken,
      expiresIn: exp - iat,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
