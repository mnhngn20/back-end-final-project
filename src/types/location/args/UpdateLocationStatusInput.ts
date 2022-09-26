import { Field, InputType } from "type-graphql";

@InputType()
export class UpdateLocationStatusInput {
  @Field()
  id: number;

  @Field()
  status: boolean;
}
