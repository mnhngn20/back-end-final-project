import { Field, InputType } from "type-graphql";

@InputType()
export class UpdatePromotionStatusInput {
  @Field()
  id: number;

  @Field()
  status: boolean;
}
