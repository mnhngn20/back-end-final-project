import { Payment } from "../../../entities/Payment";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class PaymentResponse implements IResponse {
  message: string;

  @Field((_type) => Payment, { nullable: true })
  payment?: Payment;
}
