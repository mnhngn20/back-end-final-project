import { PAYMENT_STATUS } from "./../../../constants";
import { Field, InputType } from "type-graphql";
import { ORDER_BY } from "../../../constants";

@InputType()
export class GetPaymentsInput {
  @Field({ nullable: true })
  page: number = 1;

  @Field({ nullable: true })
  limit: number = 10;

  @Field((_type) => ORDER_BY, { nullable: true })
  orderBy: ORDER_BY = ORDER_BY.ASC;

  @Field({ nullable: true })
  locationId?: number;

  @Field({ nullable: true })
  locationReservationId?: number;

  @Field({ nullable: true })
  roomId?: number;

  @Field(() => [Number], { nullable: true })
  userIds?: number[];

  @Field(() => PAYMENT_STATUS, { nullable: true })
  status?: PAYMENT_STATUS;
}
