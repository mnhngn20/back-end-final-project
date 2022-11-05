import { Field, ObjectType } from "type-graphql";
import { ListResponse } from "../../ListResponse";
import { Notification } from "../../../entities";

@ObjectType({ implements: ListResponse })
export class NotificationListResponse implements ListResponse {
  page: number;
  total: number;
  totalPages: number;
  message: string;

  @Field((_type) => [Notification])
  items: Notification[];
}
