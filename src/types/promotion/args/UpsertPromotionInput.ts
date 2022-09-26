import { PROMOTION_TYPE } from '../../../constants';
import { Field, InputType } from "type-graphql";

@InputType()
export class UpsertPromotionInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  locationId?: number;

  @Field({ nullable: true })
  code?: string;

  @Field((_type) => PROMOTION_TYPE, { nullable: true })
  type?: PROMOTION_TYPE;

  @Field({ nullable: true })
  amount?: number;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  isActive?: boolean = true;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  expirationDate?: Date;
}
