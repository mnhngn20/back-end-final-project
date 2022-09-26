import { Field, InputType } from "type-graphql";

@InputType()
export class RegisterLoginInput {
  @Field()
  email: string

  @Field()
  password: string
}