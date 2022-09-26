import { Field, InputType } from "type-graphql";

@InputType()
export class UpdateMeInput {
  @Field({ nullable: true })
  fullName?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  identityNumber?: string;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  dob?: Date;
}
