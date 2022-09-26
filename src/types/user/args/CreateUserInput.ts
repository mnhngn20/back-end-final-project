import { USER_ROLE } from "../../../constants";
import { Field, InputType } from "type-graphql";

@InputType()
export class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field({ nullable: true })
  fullName?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  identityNumber?: string;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  locationId?: number;

  @Field({ nullable: true })
  dob?: Date;

  @Field((_type) => USER_ROLE, { nullable: true })
  role?: USER_ROLE = USER_ROLE.Customer;
}
