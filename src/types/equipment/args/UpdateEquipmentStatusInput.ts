import { Field, InputType } from "type-graphql";

@InputType()
export class UpdateEquipmentStatusInput {
  @Field()
  id: number;

  @Field()
  isActive: boolean = true;
}
