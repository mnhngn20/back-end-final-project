import { ContactInformation } from "./../../../entities/ContactInformation";
import { Field, ObjectType } from "type-graphql";
import { ListResponse } from "../../ListResponse";

@ObjectType({ implements: ListResponse })
export class ContactListResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [ContactInformation])
  items: ContactInformation[];
}
