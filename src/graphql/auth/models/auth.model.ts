/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Field, Int, ObjectType } from '@nestjs/graphql';

// ✅ Réponse après login — contient le token JWT
@ObjectType()
export class LoginResponse {
  @Field()
  accessToken: string;

  // ✅ nullable — si 2FA activé, pas de token direct
  @Field({ nullable: true })
  message?: string;
}

// ✅ Réponse après signup — profil user sans password
@ObjectType()
export class UserResponse {
  @Field(() => Int)
  id: number;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field()
  isActive: boolean;
}
