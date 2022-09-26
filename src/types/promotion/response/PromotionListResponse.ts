import { ListResponse } from "../../ListResponse";
import { Field, ObjectType } from "type-graphql";
import { Promotion } from "../../../entities";

@ObjectType({ implements: ListResponse })
export class PromotionListResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [Promotion])
  items: Promotion[];
}
