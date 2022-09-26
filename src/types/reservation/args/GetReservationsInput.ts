import { Field, InputType } from "type-graphql";
import {
  ORDER_BY,
  PAYMENT_METHOD,
  RESERVATION_STATUS,
} from "../../../constants";

@InputType()
export class GetReservationsInput {
  @Field()
  limit: number = 10;

  @Field((_type) => ORDER_BY)
  orderBy: ORDER_BY = ORDER_BY.ASC;

  @Field()
  page: number = 1;

  @Field({ nullable: true })
  userId?: number;

  @Field({ nullable: true })
  creatorId?: number;

  @Field({ nullable: true })
  roomId?: number;

  @Field((_type) => RESERVATION_STATUS, { nullable: true })
  status: RESERVATION_STATUS;

  @Field((_type) => PAYMENT_METHOD, { nullable: true })
  paymentMethod: PAYMENT_METHOD;

  @Field({ nullable: true })
  hasReviewed?: boolean;

  @Field({ nullable: true })
  fromDate?: Date;

  @Field({ nullable: true })
  toDate?: Date;
}
