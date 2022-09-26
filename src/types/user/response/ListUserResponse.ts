import { Field, ObjectType } from "type-graphql";
import { User } from "../../../entities";
import { ListResponse } from "../../ListResponse";

@ObjectType({ implements: ListResponse })
export class ListUserResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [User])
  items: User[];
}
