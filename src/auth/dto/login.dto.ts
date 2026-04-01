import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  // Vérifie que c'est un email valide
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  // Minimum 8 caractères — cohérent avec le signup
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  readonly password: string;
}
