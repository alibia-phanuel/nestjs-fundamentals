import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Response } from 'express';
import { UploadService } from './upload.service';

// ─────────────────────────────────────────────────────────────
// 💡 CONCEPT — diskStorage
//
// Multer a deux modes de stockage :
// memoryStorage → fichier en RAM (rapide mais limité)
// diskStorage   → fichier sur disque (persistant) ✅
// ─────────────────────────────────────────────────────────────
const storage = diskStorage({
  // ✅ Dossier de destination
  destination: (req, file, callback) => {
    callback(null, './uploads');
  },

  // ✅ Nom du fichier — timestamp + extension originale
  // Évite les conflits de noms
  filename: (req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname);
    callback(null, `${uniqueSuffix}${ext}`);
  },
});

// ✅ Filtre — accepte seulement les images
const imageFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    callback(
      new BadRequestException('Seules les images sont acceptées'),
      false,
    );
    return;
  }
  callback(null, true);
};

@ApiTags('File Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ─────────────────────────────────────────
  // POST /upload/single
  // Upload d'un seul fichier
  // ─────────────────────────────────────────
  @Post('single')
  @ApiOperation({ summary: 'Uploader une seule image' })
  @ApiConsumes('multipart/form-data') // ← indique à Swagger le type
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary', // ← affiche un bouton de sélection dans Swagger
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter: imageFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // ✅ max 5MB
      },
    }),
  )
  uploadSingle(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }
    return {
      message: '✅ Fichier uploadé avec succès',
      ...this.uploadService.getFileInfo(file),
    };
  }

  // ─────────────────────────────────────────
  // POST /upload/multiple
  // Upload de plusieurs fichiers
  // ─────────────────────────────────────────
  @Post('multiple')
  @ApiOperation({ summary: 'Uploader plusieurs images (max 5)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      // ✅ max 5 fichiers
      storage,
      fileFilter: imageFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Aucun fichier fourni');
    }
    return {
      message: `✅ ${files.length} fichier(s) uploadé(s) avec succès`,
      files: files.map((file) => this.uploadService.getFileInfo(file)),
    };
  }

  // ─────────────────────────────────────────
  // GET /upload/:filename
  // Servir un fichier uploadé
  // ─────────────────────────────────────────
  @Get(':filename')
  @ApiOperation({ summary: 'Récupérer un fichier uploadé' })
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', filename);
    res.sendFile(filePath);
  }
}
