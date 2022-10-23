import { Field, ObjectType } from "type-graphql";
import { ListResponse } from "../../ListResponse";
import { Incident } from "../../../entities";

@ObjectType({ implements: ListResponse })
export class IncidentListResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [Incident])
  items: Incident[];
}
