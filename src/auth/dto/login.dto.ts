import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // ✅ nouveau

export class LoginDto {
  @ApiProperty({
    example: 'john.doe@gmail.com',
    description: "Email utilisé lors de l'inscription",
  })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty({
    example: 'Admin1234!',
    description: 'Minimum 8 caractères',
    minLength: 8,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  readonly password: string;
}
