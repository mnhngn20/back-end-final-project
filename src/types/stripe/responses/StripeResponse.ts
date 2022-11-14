import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class StripeResponse implements IResponse {
  message?: string;

  @Field()
  url: string;
}
