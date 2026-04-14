import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

// ─────────────────────────────────────────────────────────────
// 💡 CONCEPT — Queue Processor (Consumer)
//
// Le Processor traite les jobs de la queue
// Il tourne en arrière-plan — invisible pour le client
//
// Analogie :
// Processor = cuisine qui prépare les plats en arrière-plan
// Pendant que le serveur (Producer) prend d'autres commandes
// ─────────────────────────────────────────────────────────────
@Processor('email') // ✅ écoute la queue 'email'
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  // ─────────────────────────────────────────
  // Traite le job 'send-welcome'
  // ─────────────────────────────────────────
  @Process('send-welcome')
  async handleWelcomeEmail(job: Job) {
    const { email } = job.data as {
      email: string;
      firstName: string;
    };

    this.logger.log(`📧 Envoi email de bienvenue à ${email}`);

    // Ici tu enverrais vraiment l'email
    // avec nodemailer, SendGrid, etc.
    await new Promise((resolve) => setTimeout(resolve, 1000)); // simule l'envoi

    this.logger.log(`✅ Email envoyé à ${email}`);
    return { success: true, email };
  }

  // ─────────────────────────────────────────
  // Traite le job 'send-report'
  // ─────────────────────────────────────────
  @Process('send-report')
  async handleWeeklyReport(job: Job) {
    const { email } = job.data as { email: string };
    this.logger.log(`📊 Envoi rapport hebdomadaire à ${email}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return { success: true };
  }

  // ─────────────────────────────────────────
  // Lifecycle hooks — surveille les jobs
  // ─────────────────────────────────────────

  // ✅ Appelé quand un job commence
  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`🔄 Job #${String(job.id)} démarré : ${job.name}`);
  }

  // ✅ Appelé quand un job réussit
  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`✅ Job #${String(job.id)} terminé : ${job.name}`);
  }

  // ✅ Appelé quand un job échoue
  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `❌ Job #${String(job.id)} échoué : ${job.name} — ${error.message}`,
    );
  }
}
