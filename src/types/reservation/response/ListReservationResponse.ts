import { Field, ObjectType } from "type-graphql";
import { Reservation } from "../../../entities";
import { ListResponse } from "../../ListResponse";

@ObjectType({ implements: ListResponse })
export class ListReservationResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [Reservation])
  items: Reservation[];
}
