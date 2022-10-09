import { Field, ObjectType } from "type-graphql";
import { ListResponse } from "../../ListResponse";
import { Amenity } from "../../../entities";

@ObjectType({ implements: ListResponse })
export class AmenityListResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [Amenity])
  items: Amenity[];
}
