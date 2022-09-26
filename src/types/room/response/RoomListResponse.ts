import { Field, ObjectType } from "type-graphql";
import { ListResponse } from "../../ListResponse";
import { Room } from "../../../entities";

@ObjectType({ implements: ListResponse })
export class RoomListResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [Room])
  items: Room[];
}
