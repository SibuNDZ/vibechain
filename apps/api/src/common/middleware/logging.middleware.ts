import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    req.headers['x-request-id'] = requestId;

    const startTime = Date.now();
    const { method, originalUrl, ip } = req;

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      const message = `${method} ${originalUrl} ${statusCode} ${duration}ms`;
      const context = { requestId, ip, duration };

      if (statusCode >= 500) {
        this.logger.error(message, JSON.stringify(context));
      } else if (statusCode >= 400) {
        this.logger.warn(message, JSON.stringify(context));
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}
