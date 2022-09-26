import { Field, ObjectType } from "type-graphql";
import { ListResponse } from "../../ListResponse";
import { EquipmentType } from "../../../entities";

@ObjectType({ implements: ListResponse })
export class EquipmentTypeListResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [EquipmentType])
  items: EquipmentType[];
}
