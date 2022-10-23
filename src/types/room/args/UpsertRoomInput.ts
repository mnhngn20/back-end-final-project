import { Field, InputType } from "type-graphql";

@InputType()
export class UpsertRoomInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  thumbnail?: string;

  @Field({ nullable: true })
  floor?: number;

  @Field({ nullable: true })
  capacity?: number;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  images?: string;

  @Field({ nullable: true })
  basePrice?: number;
}
