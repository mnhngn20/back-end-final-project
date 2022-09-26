import { Field, InputType } from "type-graphql";

@InputType()
export class UpsertEquipmentInput {
  @Field({ nullable: true })
  id?: number;

  @Field()
  roomId: number;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  equipmentTypeId?: number;

  @Field({ nullable: true })
  image?: String;

  @Field({ nullable: true })
  status?: boolean = true;
}
