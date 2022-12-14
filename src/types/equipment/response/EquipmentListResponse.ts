import { Field, ObjectType } from "type-graphql";
import { ListResponse } from "../../ListResponse";
import { Equipment } from "../../../entities";

@ObjectType({ implements: ListResponse })
export class EquipmentListResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [Equipment])
  items: Equipment[];
}
