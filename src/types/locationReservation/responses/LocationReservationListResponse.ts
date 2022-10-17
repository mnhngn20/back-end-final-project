import { LocationReservation } from "./../../../entities/LocationReservation";
import { Field, ObjectType } from "type-graphql";
import { ListResponse } from "../../ListResponse";

@ObjectType({ implements: ListResponse })
export class LocationReservationListResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [LocationReservation])
  items: LocationReservation[];
}
