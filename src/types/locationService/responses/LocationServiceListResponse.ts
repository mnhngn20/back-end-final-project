import { LocationService } from "./../../../entities/LocationService";
import { Field, ObjectType } from "type-graphql";
import { ListResponse } from "../../ListResponse";

@ObjectType({ implements: ListResponse })
export class LocationServiceListResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [LocationService])
  items: LocationService[];
}
