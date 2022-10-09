import { AmenityType } from "../../../entities/AmenityType";
import { Field, ObjectType } from "type-graphql";
import { ListResponse } from "../../ListResponse";

@ObjectType({ implements: ListResponse })
export class AmenityTypeListResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [AmenityType])
  items: AmenityType[];
}
