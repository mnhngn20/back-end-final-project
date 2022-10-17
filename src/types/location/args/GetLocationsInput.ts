import { Field, Float, InputType } from "type-graphql";
import { ORDER_BY } from "../../../constants";

@InputType()
export class GetLocationsInput {
  @Field()
  limit: number = 10;

  @Field((_type) => ORDER_BY)
  orderBy: ORDER_BY = ORDER_BY.ASC;

  @Field()
  page: number = 1;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  address?: string;

  @Field(() => [Number], { nullable: true })
  locationServiceIds: number[];

  @Field(() => Float, { nullable: true })
  lat?: number;

  @Field(() => Float, { nullable: true })
  long?: number;
}
