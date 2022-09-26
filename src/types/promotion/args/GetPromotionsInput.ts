import { Field, InputType } from "type-graphql";
import { ORDER_BY, PROMOTION_TYPE } from "../../../constants";

@InputType()
export class GetPromotionsInput {
  @Field()
  limit: number = 10;

  @Field((_type) => ORDER_BY)
  orderBy: ORDER_BY = ORDER_BY.ASC;

  @Field()
  page: number = 1;

  @Field({ nullable: true })
  code?: string;

  @Field((_type) => PROMOTION_TYPE, { nullable: true })
  type?: PROMOTION_TYPE;

  @Field({ nullable: true })
  locationId?: number;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  expirationDate?: Date;
}
