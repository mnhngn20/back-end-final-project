import { Field, InputType } from "type-graphql";

@InputType()
export class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  identityNumber?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field()
  locationId: number;

  @Field({ nullable: true })
  dateOfBirth?: Date;

  @Field({ nullable: true })
  roomId?: number;
}
