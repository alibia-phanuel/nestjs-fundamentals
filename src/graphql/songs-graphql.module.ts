import { Module } from '@nestjs/common';
import { SongsResolver } from './resolvers/songs.resolver';
import { SongsModule } from '../songs/songs.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artist } from '../artists/artist.entity';
import { ArtistsLoader } from './loaders/artists.loader';
import { ExternalModule } from '../external/external.module';

@Module({
  imports: [
    // ✅ SongsModule — fournit SongsService
    SongsModule,
    // ✅ ExternalModule — fournit ExternalApiService
    ExternalModule,
    // ✅ Repository Artist — requis par ArtistsLoader
    TypeOrmModule.forFeature([Artist]),
  ],
  providers: [
    SongsResolver,
    ArtistsLoader, // ✅ DataLoader ajouté
  ],
})
export class SongsGraphqlModule {}
