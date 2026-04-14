import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailProcessor } from './email.processor';
import { EmailQueue } from './email.queue';
import { QueuesController } from './queues.controller';

@Module({
  imports: [
    BullModule.forRoot({
      redis: { host: 'localhost', port: 6379 },
    }),
    BullModule.registerQueue({ name: 'email' }),
  ],
  controllers: [QueuesController],
  providers: [EmailProcessor, EmailQueue],
  exports: [EmailQueue],
})
export class QueuesModule {}
