import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExternalApiService } from './external-api.service';

@Module({
  imports: [
    // ✅ HttpModule — fournit HttpService via @nestjs/axios
    HttpModule.register({
      timeout: 5000, // ← 5 secondes max avant timeout
      maxRedirects: 5, // ← max 5 redirections
    }),
  ],
  providers: [ExternalApiService],
  // ✅ Export pour que d'autres modules puissent l'utiliser
  exports: [ExternalApiService],
})
export class ExternalModule {}
