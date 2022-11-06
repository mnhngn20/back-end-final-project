import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class GetMyNotificationStatusResponse {
  @Field()
  message: string;

  @Field()
  total: number;
}
