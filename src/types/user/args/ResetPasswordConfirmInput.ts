import { Field, InputType } from "type-graphql";

@InputType()
export class ResetPasswordConfirmInput {
  @Field()
  token: string;

  @Field()
  password: string;
}
