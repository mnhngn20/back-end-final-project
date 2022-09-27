import { Field, InputType } from "type-graphql";

@InputType()
export class UpdateUserInput {
  @Field()
  id: number;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  identityNumber?: string;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  dateOfBirth?: Date;

  @Field({ nullable: true })
  roomId?: number;
}
