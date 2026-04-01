import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsDateString,
  IsMilitaryTime,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class UpdateSongDto {
  // Tous les champs sont optionnels pour un UPDATE
  // On met à jour seulement ce qui est envoyé dans le body

  @IsOptional()
  @IsNotEmpty() // ← si fourni → ne doit pas être vide
  @IsString()
  readonly title?: string;

  // Tableau d'IDs d'artistes — cohérent avec CreateSongDto
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  readonly artists?: number[];

  @IsOptional()
  @IsDateString()
  readonly releaseDate?: Date;

  @IsOptional()
  @IsMilitaryTime()
  readonly duration?: string;

  @IsOptional()
  @IsString()
  readonly lyrics?: string;
}
