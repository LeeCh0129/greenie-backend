import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';
import * as Sentry from '@sentry/node';
import { IncomingWebhook } from '@slack/client';

@Injectable()
export class WebhookInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      tap({
        error: (error: Error): void => {
          const req = context.switchToHttp().getRequest();

          Sentry.captureException(error);
          const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK);
          webhook.send({
            attachments: [
              {
                color: 'danger',
                text: '🚨 Server Error 🚨',
                fields: [
                  {
                    title: `Request URL: ${req.method} ${req.originalUrl}`,
                    value: error.stack,
                    short: false,
                  },
                ],
                ts: Math.floor(new Date().getTime() / 1000).toString(),
              },
            ],
          });
        },
      }),
    );
  }
}
