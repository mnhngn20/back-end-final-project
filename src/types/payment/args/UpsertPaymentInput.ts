import { DISCOUNT_TYPE, PAYMENT_STATUS } from "./../../../constants";
import { Field, InputType } from "type-graphql";

@InputType()
export class UpsertPaymentInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  electricCounter?: number;

  @Field({ nullable: true })
  waterPrice?: number;

  @Field({ nullable: true })
  discount?: number;

  @Field(() => DISCOUNT_TYPE, { nullable: true })
  discountType?: DISCOUNT_TYPE;

  @Field(() => PAYMENT_STATUS, { nullable: true })
  status?: PAYMENT_STATUS;

  @Field()
  roomId: number;

  @Field()
  locationReservationId: number;

  @Field()
  locationId: number;
}
