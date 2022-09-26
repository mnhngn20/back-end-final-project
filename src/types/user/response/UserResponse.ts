import { JwtPayload } from "jsonwebtoken";
import { User } from "../../../entities";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class UserResponse implements IResponse {
  message: string;

  @Field((_type) => User, { nullable: true })
  user?: User;
}

@ObjectType({ implements: IResponse })
export class CheckAuthResponse implements IResponse {
  message: string;

  @Field((_type) => User, { nullable: true })
  user?: Partial<User> & JwtPayload;
}
