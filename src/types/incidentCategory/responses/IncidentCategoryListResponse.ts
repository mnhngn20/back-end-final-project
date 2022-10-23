import { IncidentCategory } from "../../../entities/IncidentCategory";
import { Field, ObjectType } from "type-graphql";
import { ListResponse } from "../../ListResponse";

@ObjectType({ implements: ListResponse })
export class IncidentCategoryListResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [IncidentCategory])
  items: IncidentCategory[];
}
