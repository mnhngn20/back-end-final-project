import { Field, InputType } from "type-graphql";
import { ORDER_BY } from "../../../constants";

@InputType()
export class GetRoomsInput {
  @Field({ nullable: true })
  page: number = 1;

  @Field({ nullable: true })
  limit: number = 10;

  @Field({ nullable: true })
  roomTypeId?: number;

  @Field({ nullable: true })
  locationId?: number;

  @Field({ nullable: true })
  keyword?: String;

  @Field({ nullable: true })
  name?: String;

  @Field({ nullable: true })
  description?: String;

  @Field({ nullable: true })
  floor?: number;

  @Field({ nullable: true })
  minRate?: number;

  @Field({ nullable: true })
  status?: boolean;

  @Field({ nullable: true })
  minBasePrice?: number;

  @Field({ nullable: true })
  maxBasePrice?: number;

  @Field((_type) => ORDER_BY, { nullable: true })
  orderBy: ORDER_BY = ORDER_BY.ASC;
}
