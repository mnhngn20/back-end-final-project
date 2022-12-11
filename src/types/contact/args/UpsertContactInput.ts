import { Field, InputType } from "type-graphql";

@InputType()
export class UpsertContactInput {
  @Field({ nullable: true })
  id: number;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  locationId: number;
}
