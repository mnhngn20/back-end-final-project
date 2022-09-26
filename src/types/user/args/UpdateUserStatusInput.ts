import { Field, InputType } from "type-graphql";

@InputType()
export class UpdateUserStatusInput {
  @Field()
  id: number;

  @Field()
  status: boolean;
}
