import { Field, InputType } from "type-graphql";

@InputType()
export class SendNotificationInput {
  @Field()
  uid: number;

  @Field()
  title: string;

  @Field()
  content: string;

  @Field({ nullable: true })
  data?: string;
}
