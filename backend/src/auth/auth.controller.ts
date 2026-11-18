import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator.js';
import { AuthService } from './auth.service.js';
import { LoginResponseDto } from './dto/login-response.dto.js';
import { LoginDto } from './dto/login.dto.js';

const LOGIN_ATTEMPTS_PER_MINUTE = 5;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: LOGIN_ATTEMPTS_PER_MINUTE, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid body' })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas',
  })
  @ApiTooManyRequestsResponse({
    description: 'Demasiados intentos, espera un minuto',
  })
  login(@Body() { email, password }: LoginDto) {
    return this.authService.login(email, password);
  }
}
