import { Field, InputType } from "type-graphql";

@InputType()
export class CreateInstallationInput {
  @Field()
  userId: number;

  @Field()
  firebaseToken: string;
}
