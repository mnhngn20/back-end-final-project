import { Field, InputType } from "type-graphql";

@InputType()
export class GetAccessTokenInput {
  @Field()
  refreshToken: string;
}
