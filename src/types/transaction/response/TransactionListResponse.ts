import { Field, ObjectType } from "type-graphql";
import { ListResponse } from "../../ListResponse";
import { Transaction } from "../../../entities";

@ObjectType({ implements: ListResponse })
export class TransactionListResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [Transaction])
  items: Transaction[];
}
