import { Promotion } from "../../../entities";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class PromotionResponse implements IResponse {
  message: string;

  @Field((_type) => Promotion, { nullable: true })
  promotion?: Promotion;
}
