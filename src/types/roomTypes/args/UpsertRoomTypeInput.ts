import { Field, InputType } from "type-graphql";

@InputType()
export class UpsertRoomTypeInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;
}
