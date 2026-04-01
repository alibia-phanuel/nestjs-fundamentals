import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsDateString,
  IsMilitaryTime,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateSongDto {
  // Titre obligatoire — string non vide
  @IsNotEmpty()
  @IsString()
  readonly title: string;

  // Tableau d'IDs d'artistes — chaque élément doit être un number
  // Ex: [1, 2] pour lier les artistes à la chanson
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true }) // ✅ vérifie que chaque élément est un number
  readonly artists: number[];

  // Date de sortie au format ISO 8601 — Ex: "2019-11-29"
  @IsNotEmpty()
  @IsDateString()
  readonly releaseDate: Date;

  // Durée au format militaire — Ex: "03:20"
  @IsNotEmpty()
  @IsMilitaryTime()
  readonly duration: string;

  // Paroles optionnelles
  @IsOptional()
  @IsString()
  readonly lyrics?: string;
}
