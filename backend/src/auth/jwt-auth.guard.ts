import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator.js';
import type { JwtPayload } from './auth.service.js';

const UNAUTHORIZED_MESSAGE = 'Token de acceso ausente, inválido o vencido';

export interface AuthenticatedUser {
  userId: string;
  email: string;
}

const extractBearerToken = (request: Request) => {
  const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
  return scheme === 'Bearer' && token ? token : undefined;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const token = extractBearerToken(request);
    if (!token) throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);

    try {
      const { sub, email } =
        await this.jwtService.verifyAsync<JwtPayload>(token);
      request.user = { userId: sub, email };
      return true;
    } catch {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }
  }
}
