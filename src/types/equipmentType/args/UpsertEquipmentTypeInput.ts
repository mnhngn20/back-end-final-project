import { Field, InputType } from "type-graphql";

@InputType()
export class UpsertEquipmentTypeInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  locationId?: number;

  @Field({ nullable: true })
  description?: string;
}
