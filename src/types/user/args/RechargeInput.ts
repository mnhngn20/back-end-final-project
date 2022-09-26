import { Field, InputType } from "type-graphql";

@InputType()
export class RechargeInput {
  @Field()
  amount: number
  
  @Field()
  userId: number

  @Field({ nullable: true })
  isAdding?: boolean = true
}
