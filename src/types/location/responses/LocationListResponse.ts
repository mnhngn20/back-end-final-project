import { ListResponse } from "../../ListResponse";
import { Field, ObjectType } from "type-graphql";
import { Location } from "../../../entities";

@ObjectType({ implements: ListResponse })
export class LocationListResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [Location])
  items: Location[];
}
