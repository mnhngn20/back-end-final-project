import { Field, InputType } from "type-graphql";

@InputType()
export class UpdateLocationServiceStatusInput {
  @Field()
  id: number;

  @Field()
  isActive: boolean = true;
}
