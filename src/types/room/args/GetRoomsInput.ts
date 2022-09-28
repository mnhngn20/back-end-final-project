import { Field, InputType } from "type-graphql";
import { ORDER_BY, ROOM_STATUS } from "../../../constants";

@InputType()
export class GetRoomsInput {
  @Field({ nullable: true })
  page: number = 1;

  @Field({ nullable: true })
  limit: number = 10;

  @Field({ nullable: true })
  locationId?: number;

  @Field(() => ROOM_STATUS, { nullable: true })
  status?: ROOM_STATUS;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  minBasePrice?: number;

  @Field({ nullable: true })
  maxBasePrice?: number;

  @Field((_type) => ORDER_BY, { nullable: true })
  orderBy: ORDER_BY = ORDER_BY.ASC;
}
