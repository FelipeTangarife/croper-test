import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AppExceptionsFilter } from './app-exceptions.filter.js';

const createHost = () => {
  const reply = vi.fn();
  const adapterHost = {
    httpAdapter: { reply, isHeadersSent: () => false },
  } as unknown as HttpAdapterHost;
  const host = {
    getType: () => 'http',
    switchToHttp: () => ({ getResponse: () => ({}), getRequest: () => ({}) }),
    getArgByIndex: () => ({}),
    getArgs: () => [],
  } as unknown as ArgumentsHost;
  return { reply, adapterHost, host };
};

describe('AppExceptionsFilter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hides unexpected errors behind a Spanish 500 and logs them', () => {
    const logError = vi.spyOn(Logger, 'error').mockImplementation(() => {});
    const { reply, adapterHost, host } = createHost();
    const filter = new AppExceptionsFilter(adapterHost.httpAdapter);

    filter.catch(new Error('database exploded'), host);

    expect(reply).toHaveBeenCalledWith(
      {},
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error interno del servidor',
        error: 'Internal Server Error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(logError).toHaveBeenCalled();
  });
});
