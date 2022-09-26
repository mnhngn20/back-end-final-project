import { USER_ROLE } from "../../../constants";
import { Field, InputType } from "type-graphql";

@InputType()
export class ChangeUserRoleInput {
  @Field()
  id: number;

  @Field((_type) => USER_ROLE)
  role: USER_ROLE;
}
