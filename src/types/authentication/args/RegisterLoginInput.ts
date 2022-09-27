import { Field, InputType } from "type-graphql";

@InputType()
export class RegisterLoginInput {
  @Field()
  email: string;

  @Field({ nullable: true })
  password: string;

  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  address: string;

  @Field({ nullable: true })
  phoneNumber: string;

  @Field({ nullable: true })
  identityNumber: string;

  @Field({ nullable: true })
  dateOfBirth: Date;
}
