import { Field, InputType } from "type-graphql";

@InputType()
export class CreateStripeCheckoutInput {
  @Field()
  successUrl: string;
  @Field()
  cancelUrl: string;
  @Field()
  paymentId: number;
  @Field()
  payerId: number;
}
