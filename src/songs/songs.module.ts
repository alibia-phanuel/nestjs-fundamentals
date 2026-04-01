import { Module } from '@nestjs/common';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Song } from './songs.entity';
import { connection } from 'src/common/constants/connection'; // ✅ ajout
import { Artist } from 'src/artists/artist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Song, Artist])],
  controllers: [SongsController],
  providers: [
    SongsService,
    {
      provide: 'CONNECTION', // ✅ ajout
      useValue: connection,
    },
  ],
})
export class SongsModule {}
