import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { MulterModule } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';

// ✅ Crée le dossier uploads s'il n'existe pas
if (!existsSync('./uploads')) {
  mkdirSync('./uploads', { recursive: true });
}

@Module({
  imports: [
    // ✅ Configure Multer globalement pour ce module
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
