import { ListResponse } from "../../ListResponse";
import { Field, ObjectType } from "type-graphql";
import { Review } from "../../../entities";

@ObjectType({ implements: ListResponse })
export class ReviewListResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [Review])
  items: Review[];
}
