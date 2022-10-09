import { Field, InputType } from "type-graphql";

@InputType()
export class UpdateAmenityStatusInput {
  @Field()
  id: number;

  @Field()
  isActive: boolean = true;
}
