import { Injectable } from '@nestjs/common';

// @Injectable() permet à NestJS d'injecter ce service
// dans d'autres classes automatiquement
@Injectable()
export class DevConfigService {
  // Variable qui contient l'hôte de la base de données
  DBHOST = 'localhost';

  // Méthode pour récupérer l'hôte
  getDbHost(): string {
    return this.DBHOST;
  }
}
