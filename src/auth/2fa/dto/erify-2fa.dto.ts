// src/auth/2fa/dto/verify-2fa.dto.ts
import { IsNotEmpty, IsString, Length } from 'class-validator';
export class VerifyTwoFactorDto {
  // Code à 6 chiffres généré par Google Authenticator
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'Le code doit contenir exactement 6 chiffres' })
  readonly code: string;
}
