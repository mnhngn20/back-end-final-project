import { Field, InputType } from "type-graphql";
import { NOTIFICATION_TYPE, ORDER_BY } from "../../../constants";

@InputType()
export class GetNotificationsInput {
  @Field({ nullable: true })
  page: number = 1;

  @Field({ nullable: true })
  limit: number = 10;

  @Field((_type) => ORDER_BY, { nullable: true })
  orderBy: ORDER_BY = ORDER_BY.ASC;

  @Field({ nullable: true })
  locationId?: number;

  @Field(() => NOTIFICATION_TYPE, { nullable: true })
  type?: NOTIFICATION_TYPE;

  @Field({ nullable: true })
  isAdminOnly?: boolean;

  @Field({ nullable: true })
  userId?: number;
}
