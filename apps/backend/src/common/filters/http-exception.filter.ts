import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Đã có lỗi xảy ra trên hệ thống. Vui lòng thử lại sau.';
    let errorName = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message || message;
        errorName = resObj.error || exception.name;
      }
    } else if (
      exception instanceof Error &&
      (exception.message.includes('Định dạng ngày') ||
        exception.message.includes('không tồn tại trên lịch') ||
        exception.message.includes('Tháng không hợp lệ') ||
        exception.message.includes('Ngày trả không được trước ngày nhận'))
    ) {
      status = HttpStatus.BAD_REQUEST;
      errorName = 'BadRequest';
      message = exception.message;
    } else {
      this.logger.error(
        `[UnhandledException] ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      error: errorName,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

