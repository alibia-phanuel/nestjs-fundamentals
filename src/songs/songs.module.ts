import { Module } from '@nestjs/common';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Song } from './songs.entity';
import { connection } from 'src/common/constants/connection';
import { Artist } from 'src/artists/artist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Song, Artist])],
  controllers: [SongsController],
  providers: [
    SongsService,
    {
      provide: 'CONNECTION',
      useValue: connection,
    },
  ],
  // ✅ Export SongsService — indispensable pour que
  // SongsGraphqlModule puisse l'injecter dans SongsResolver
  exports: [SongsService],
})
export class SongsModule {}
