import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  // Override the getTracker method to customize the tracking key if needed
  // Here we're using the default implementation based on IP
  protected getTracker(req: Record<string, any>): Promise<string> {
    return Promise.resolve(req.ip);
  }
}
