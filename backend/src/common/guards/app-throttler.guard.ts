import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ThrottlerGuard, type ThrottlerLimitDetail } from '@nestjs/throttler';

export const TOO_MANY_REQUESTS_MESSAGE =
  'Demasiados intentos, espera un minuto';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: await this.getErrorMessage(context, throttlerLimitDetail),
        error: 'Too Many Requests',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
