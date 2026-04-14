import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// ─────────────────────────────────────────────────────────────
// 💡 CONCEPT — External API
//
// @nestjs/axios → wrapper NestJS autour d'axios
// firstValueFrom → convertit Observable RxJS en Promise
// C'est le standard pour les appels HTTP dans NestJS
// ─────────────────────────────────────────────────────────────
@Injectable()
export class ExternalApiService {
  private readonly logger = new Logger(ExternalApiService.name);

  constructor(private readonly httpService: HttpService) {}

  // ✅ Récupère les infos d'un artiste depuis MusicBrainz
  // MusicBrainz = API musicale gratuite et ouverte
  async getArtistInfo(artistName: string): Promise<Record<string, unknown>> {
    try {
      const encodedName = encodeURIComponent(artistName);
      const url = `https://musicbrainz.org/ws/2/artist/?query=${encodedName}&fmt=json`;

      // ✅ firstValueFrom — convertit Observable en Promise
      // this.httpService.get() retourne un Observable
      // on le convertit en Promise pour utiliser async/await
      const response = await firstValueFrom(
        this.httpService.get<Record<string, unknown>>(url, {
          headers: {
            // ✅ MusicBrainz requiert un User-Agent sinon 403
            'User-Agent': 'NestJS-Learning-App/1.0 (contact@example.com)',
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Erreur API externe: ${String(error)}`);
      throw error;
    }
  }
}
