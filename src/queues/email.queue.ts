import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

// ─────────────────────────────────────────────────────────────
// 💡 CONCEPT — Queue Producer
//
// Le Producer ajoute des jobs dans la queue
// Il ne les traite PAS — il délègue au Processor
//
// Analogie :
// Producer = serveur qui prend la commande
// Queue    = liste des commandes en attente
// Processor = cuisine qui prépare les plats
// ─────────────────────────────────────────────────────────────
@Injectable()
export class EmailQueue {
  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {}

  // ✅ Ajoute un job d'envoi d'email dans la queue
  async sendWelcomeEmail(email: string, firstName: string) {
    await this.emailQueue.add(
      'send-welcome', // ← nom du job
      {
        email,
        firstName,
        subject: 'Bienvenue !',
        template: 'welcome',
      },
      {
        attempts: 3, // ← réessaie 3 fois si échec
        backoff: 5000, // ← attend 5 secondes entre chaque essai
        removeOnComplete: true, // ← supprime le job après succès
      },
    );
  }

  // ✅ Ajoute un job de rapport dans la queue
  // Avec un délai — exécuté dans 1 heure
  async sendWeeklyReport(email: string) {
    await this.emailQueue.add(
      'send-report',
      { email },
      {
        delay: 60 * 60 * 1000, // ← exécuté dans 1 heure
        attempts: 2,
      },
    );
  }
}
