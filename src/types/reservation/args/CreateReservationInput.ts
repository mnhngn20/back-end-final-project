import { PAYMENT_METHOD } from "../../../constants";
import { Field, InputType } from "type-graphql";

@InputType()
export class CreateReservationInput {
  @Field()
  roomId: number;

  @Field({ nullable: true })
  userId?: number;

  @Field((_type) => PAYMENT_METHOD, { nullable: true })
  paymentMethod?: PAYMENT_METHOD = PAYMENT_METHOD.Cash;

  @Field()
  planId: number;

  @Field({ nullable: true })
  promotionCode?: string;

  @Field()
  fromDate: Date;

  @Field()
  toDate: Date;
}
