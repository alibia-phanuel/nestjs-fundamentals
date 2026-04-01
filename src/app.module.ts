import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SongsModule } from './songs/songs.module';
import { LoggerMiddleware } from './common/middleware/logger/logger.middleware';
import { SongsController } from './songs/songs.controller';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Song } from './songs/songs.entity';
import { Artist } from './artists/artist.entity';
import { User } from './users/user.entity';
import { DevConfigService } from './common/providers/DevConfigService';
import { DataSource } from 'typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module'; // ✅ ajouté
import { Playlist } from './playlists/playlist.entity';

const devConfig = { port: 3000 };
const proConfig = { port: 4000 };

const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'alibia2001',
  database: 'spotify-clone-01',
  entities: [Song, Artist, User, Playlist],
  synchronize: true,
};

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    SongsModule,
    AuthModule,
    UsersModule, // ✅ ajouté — UsersService disponible via ce module
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DevConfigService,
    {
      provide: 'CONFIG',
      useFactory: () => {
        const env = process.env.NODE_ENV || 'development';
        return env === 'production' ? proConfig : devConfig;
      },
    },
    // ✅ UsersService supprimé ici — il est dans UsersModule !
  ],
})
export class AppModule implements NestModule {
  constructor(private readonly dataSource: DataSource) {
    console.log('DataSource initialized:', this.dataSource.isInitialized);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes(SongsController);
  }
}
