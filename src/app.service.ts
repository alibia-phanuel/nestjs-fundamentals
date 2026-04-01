import { Inject, Injectable } from '@nestjs/common';
import { DevConfigService } from './common/providers/DevConfigService';

@Injectable()
export class AppService {
  constructor(
    // Injection classique — NestJS trouve DevConfigService
    // grâce au type TypeScript
    private readonly devConfigService: DevConfigService,
    // Injection avec token string — obligatoire car 'CONFIG'
    // est un objet simple sans classe TypeScript associée
    // { port: string } = la forme de l'objet qu'on attend
    @Inject('CONFIG') private readonly config: { port: number },
  ) {}
  getHello(): string {
    // On combine les deux services injectés dans la réponse
    // devConfigService.getDbHost() → 'localhost'
    // config.port → 3000 (dev) ou 400 (prod)
    return `Hello World! DB Host: ${this.devConfigService.getDbHost()}, Port: ${this.config.port}`;
  }
}
