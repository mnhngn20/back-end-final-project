import { Field, InputType } from "type-graphql";
import { ORDER_BY, USER_ROLE } from "../../../constants";

@InputType()
export class GetUsersInput {
  @Field()
  limit: number = 10;

  @Field((_type) => ORDER_BY)
  orderBy: ORDER_BY = ORDER_BY.ASC;

  @Field()
  page: number = 1;

  @Field({ nullable: true })
  email?: string = "";

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  locationId?: number;

  @Field({ nullable: true })
  roomId?: number;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field((_type) => USER_ROLE, { nullable: true })
  role?: USER_ROLE;
}
