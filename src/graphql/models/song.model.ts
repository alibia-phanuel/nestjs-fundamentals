/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Field, Int, ObjectType } from '@nestjs/graphql';

// ✅ @ObjectType → dit à GraphQL que c'est un type retournable
// équivalent d'une interface TypeScript mais pour GraphQL
@ObjectType()
export class SongModel {
  // ✅ @Field → expose le champ dans le schema GraphQL
  // sans @Field → le champ est invisible pour GraphQL
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field()
  duration: string;

  // ✅ nullable: true → le champ peut être absent
  @Field({ nullable: true })
  lyrics?: string;
}
