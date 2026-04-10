import { Module } from '@nestjs/common';
import { SongsResolver } from './resolvers/songs.resolver';
import { SongsModule } from '../songs/songs.module';

@Module({
  imports: [
    // ✅ SongsModule exporté pour que SongsResolver
    // puisse injecter SongsService
    SongsModule,
  ],
  providers: [SongsResolver],
})
export class SongsGraphqlModule {}
