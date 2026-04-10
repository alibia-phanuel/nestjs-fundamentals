import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SongsModule } from './songs/songs.module';
import { LoggerMiddleware } from './common/middleware/logger/logger.middleware';
import { SongsController } from './songs/songs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Song } from './songs/songs.entity';
import { Artist } from './artists/artist.entity';
import { User } from './users/user.entity';
import { Playlist } from './playlists/playlist.entity';
import { DataSource } from 'typeorm';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { SongsGraphqlModule } from './graphql/songs-graphql.module'; // ✅ ajout
import { AuthGraphqlModule } from './graphql/auth/auth-graphql.module';
// ✅ Configs par domaine
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';
// ✅ Validation Joi au démarrage
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    // ✅ GraphQLModule — doit être avant les autres modules
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      // ✅ Active les subscriptions via WebSocket
      installSubscriptionHandlers: true,
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
    }),

    // ✅ ConfigModule — charge .env + valide + configs par domaine
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, appConfig],
      validationSchema: envValidationSchema,
    }),

    // ✅ TypeORM — attend ConfigModule
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [Song, Artist, User, Playlist],
        synchronize: false,
        migrationsRun: true,
        migrations: [
          configService.get<string>('app.env') === 'production'
            ? __dirname + '/migrations/*.js'
            : __dirname + '/migrations/*.ts',
        ],
        logging: configService.get<string>('app.env') !== 'production',
        extra: {
          max: 10,
          connectionTimeoutMillis: 3000,
        },
      }),
    }),

    SongsModule,
    AuthModule,
    UsersModule,
    ChatModule,
    SongsGraphqlModule,
    AuthGraphqlModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'CONFIG',
      useFactory: (configService: ConfigService) => ({
        port: configService.get<number>('app.port'),
        env: configService.get<string>('app.env'),
      }),
      inject: [ConfigService],
    },
  ],
})
export class AppModule implements NestModule {
  private readonly logger = new Logger(AppModule.name);

  constructor(private readonly dataSource: DataSource) {
    this.logger.log(
      `DataSource initialized: ${String(this.dataSource.isInitialized)}`,
    );
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes(SongsController);
  }
}
