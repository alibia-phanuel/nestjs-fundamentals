import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval, Timeout } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────
  // CRON — toutes les 30 secondes
  // CronExpression.EVERY_30_SECONDS = '*/30 * * * * *'
  // ─────────────────────────────────────────
  @Cron(CronExpression.EVERY_30_SECONDS)
  async logActivePosts() {
    const count = await this.prisma.post.count({
      where: { published: true },
    });
    this.logger.log(`📊 Posts publiés actifs : ${String(count)}`);
  }

  // ─────────────────────────────────────────
  // CRON — chaque jour à minuit
  // Nettoie les posts non publiés depuis plus de 30 jours
  // ─────────────────────────────────────────
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanOldDraftPosts() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.post.deleteMany({
      where: {
        published: false,
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    this.logger.log(
      `🧹 Nettoyage : ${String(result.count)} vieux brouillons supprimés`,
    );
  }

  // ─────────────────────────────────────────
  // CRON — chaque lundi à 9h
  // Envoyer un rapport hebdomadaire
  // ─────────────────────────────────────────
  @Cron('0 9 * * 1') // ← chaque lundi à 9h00
  sendWeeklyReport() {
    this.logger.log('📧 Envoi du rapport hebdomadaire...');
    // Ici tu enverrais un email avec les stats de la semaine
  }

  // ─────────────────────────────────────────
  // INTERVAL — toutes les 10 secondes
  // Différent de CRON — setInterval sous le capot
  // ─────────────────────────────────────────
  @Interval(10000) // ← 10000 ms = 10 secondes
  handleInterval() {
    this.logger.debug('⏱️ Interval — exécuté toutes les 10 secondes');
  }

  // ─────────────────────────────────────────
  // TIMEOUT — exécuté UNE SEULE FOIS
  // 5 secondes après le démarrage de l'app
  // ─────────────────────────────────────────
  @Timeout(5000) // ← 5000 ms = 5 secondes après démarrage
  handleTimeout() {
    this.logger.debug('🚀 App démarrée depuis 5 secondes !');
  }
}
