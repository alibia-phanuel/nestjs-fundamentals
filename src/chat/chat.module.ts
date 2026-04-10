import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';

@Module({
  providers: [ChatGateway], // ✅ Gateway = Provider dans NestJS
})
export class ChatModule {}
