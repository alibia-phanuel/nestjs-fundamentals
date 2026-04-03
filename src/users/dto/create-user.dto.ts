import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // ✅ nouveau

export class CreateUserDTO {
  @ApiProperty({
    example: 'John',
    description: 'Prénom du user',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Nom du user',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'john.doe@gmail.com',
    description: 'Email unique — utilisé pour la connexion',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Admin1234!',
    description: 'Minimum 8 caractères',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
