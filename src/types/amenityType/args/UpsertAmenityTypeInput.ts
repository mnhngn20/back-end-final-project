import { Field, InputType } from "type-graphql";

@InputType()
export class UpsertAmenityTypeInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  icon?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  isActive?: boolean;
}
