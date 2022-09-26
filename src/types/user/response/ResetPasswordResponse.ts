import { Field, ObjectType } from "type-graphql";
@ObjectType()
export class ResetPasswordResponse {
  @Field({ nullable: true })
  message: string;
}
