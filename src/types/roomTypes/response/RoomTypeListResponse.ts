import { Field, ObjectType } from "type-graphql";
import { ListResponse } from "../../ListResponse";
import { RoomType } from "../../../entities";

@ObjectType({ implements: ListResponse })
export class RoomTypeListResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [RoomType])
  items: RoomType[];
}
