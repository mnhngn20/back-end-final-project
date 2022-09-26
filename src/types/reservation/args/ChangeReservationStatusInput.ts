import { RESERVATION_STATUS } from "../../../constants";
import { Field, InputType } from "type-graphql";

@InputType()
export class ChangeReservationStatusInput {
  @Field()
  id: number;

  @Field((_type) => RESERVATION_STATUS)
  status: RESERVATION_STATUS;
}
