import { Payment } from "../../../entities/Payment";
import { Field, ObjectType } from "type-graphql";
import { ListResponse } from "../../ListResponse";

@ObjectType({ implements: ListResponse })
export class PaymentListResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [Payment])
  items: Payment[];
}
