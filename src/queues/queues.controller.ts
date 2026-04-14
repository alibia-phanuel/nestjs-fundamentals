import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EmailQueue } from './email.queue';

@ApiTags('Queues')
@Controller('queues')
export class QueuesController {
  constructor(private readonly emailQueue: EmailQueue) {}

  @Post('send-welcome')
  @ApiOperation({ summary: 'Envoyer un email de bienvenue (en arrière-plan)' })
  async sendWelcome(@Body() body: { email: string; firstName: string }) {
    // ✅ Réponse IMMÉDIATE — l'email sera envoyé en arrière-plan
    await this.emailQueue.sendWelcomeEmail(body.email, body.firstName);
    return {
      message: '✅ Email mis en queue — sera envoyé en arrière-plan',
    };
  }

  @Post('send-report')
  @ApiOperation({ summary: 'Planifier un rapport (dans 1 heure)' })
  async sendReport(@Body() body: { email: string }) {
    await this.emailQueue.sendWeeklyReport(body.email);
    return {
      message: '✅ Rapport planifié dans 1 heure',
    };
  }
}
