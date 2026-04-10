import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

// ✅ @InputType → type utilisé dans les mutations
// équivalent d'un DTO en REST
@InputType()
export class CreateSongInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  title: string;

  @Field()
  @IsString()
  duration: string;

  @Field({ nullable: true })
  lyrics?: string;
}
