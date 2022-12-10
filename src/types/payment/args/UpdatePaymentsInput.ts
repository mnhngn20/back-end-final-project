import { DISCOUNT_TYPE, PAYMENT_STATUS } from "./../../../constants";
import { Field, InputType } from "type-graphql";

@InputType()
export class UpdatePaymentsInput {
  @Field({ nullable: true })
  locationReservationId?: number;

  @Field({ nullable: true })
  electricCounter?: number;

  @Field({ nullable: true })
  waterPrice?: number;

  @Field({ nullable: true })
  extraFee?: number;

  @Field({ nullable: true })
  prePaidFee?: number;

  @Field({ nullable: true })
  discount?: number;

  @Field(() => DISCOUNT_TYPE, { nullable: true })
  discountType?: DISCOUNT_TYPE;

  @Field(() => PAYMENT_STATUS, { nullable: true })
  status?: PAYMENT_STATUS;
}
