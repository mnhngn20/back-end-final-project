import { Field, InputType } from "type-graphql";

@InputType()
export class ChangeUserStatusInput {
  @Field()
  id: number;

  @Field()
  isActive: boolean;
}
