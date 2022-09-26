import { Field, InputType } from "type-graphql";
import { ORDER_BY } from "../../../constants";

@InputType()
export class GetEquipmentTypesInput {
  @Field({ nullable: true })
  page: number = 1;

  @Field({ nullable: true })
  limit: number = 10;

  @Field((_type) => ORDER_BY, { nullable: true })
  orderBy: ORDER_BY = ORDER_BY.ASC;

  @Field({ nullable: true })
  keyword?: String;

  @Field({ nullable: true })
  name?: String;

  @Field({ nullable: true })
  description?: String;

  @Field({ nullable: true })
  locationId?: number;
}
