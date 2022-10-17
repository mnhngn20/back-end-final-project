import { PAYMENT_STATUS } from "../../../constants";
import { Field, InputType } from "type-graphql";

@InputType()
export class UpdatePaymentStatusInput {
  @Field()
  id: number;

  @Field(() => PAYMENT_STATUS)
  status: PAYMENT_STATUS;
}
