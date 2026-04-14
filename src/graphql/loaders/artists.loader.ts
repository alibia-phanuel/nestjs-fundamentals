import DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Artist } from '../../artists/artist.entity';

// ─────────────────────────────────────────────────────────────
// 💡 CONCEPT — DataLoader
//
// Scope.REQUEST → un nouveau DataLoader par requête HTTP
// Garantit que le batching se fait par requête
// et que le cache ne pollue pas les autres requêtes
// ─────────────────────────────────────────────────────────────
@Injectable({ scope: Scope.REQUEST })
export class ArtistsLoader {
  constructor(
    @InjectRepository(Artist)
    private readonly artistsRepository: Repository<Artist>,
  ) {}

  // ✅ Le DataLoader regroupe TOUTES les demandes
  // et les résout en UNE seule requête DB
  readonly loader = new DataLoader<number, Artist | null>(
    async (artistIds: readonly number[]) => {
      // ✅ Une seule requête pour TOUS les IDs
      // Au lieu de N requêtes SELECT WHERE id = ?
      // On fait 1 requête SELECT WHERE id IN (1, 2, 3...)
      const artists = await this.artistsRepository.findBy({
        id: In([...artistIds]),
      });

      // ✅ IMPORTANT — retourner dans le MÊME ordre que les IDs
      // DataLoader l'exige pour associer chaque résultat au bon ID
      // Si l'artiste n'existe pas → null
      return artistIds.map(
        (id) => artists.find((artist) => artist.id === id) ?? null,
      );
    },
  );
}
