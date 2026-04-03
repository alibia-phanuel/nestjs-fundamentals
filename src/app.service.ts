import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // ✅ ConfigService au lieu de DevConfigService

@Injectable()
export class AppService {
  constructor(
    // ✅ ConfigService — remplace DevConfigService
    // accède aux variables .env via configService.get()
    private readonly configService: ConfigService,

    // Injection du provider CONFIG défini dans AppModule
    @Inject('CONFIG') private readonly config: { port: number; env: string },
  ) {}

  getHello(): string {
    // ✅ ConfigService pour accéder aux variables d'env
    const dbHost =
      this.configService.get<string>('database.host') ?? 'localhost';
    return `Hello NestJS! 🔥 DB Host: ${dbHost}, Port: ${String(this.config.port)}, Env: ${this.config.env}`;
  }
}
