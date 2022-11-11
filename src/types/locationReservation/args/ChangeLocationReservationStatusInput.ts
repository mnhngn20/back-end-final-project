import { Field, InputType } from "type-graphql";
import { LOCATION_RESERVATION_STATUS } from "../../../constants";

@InputType()
export class ChangeLocationReservationStatusInput {
  @Field()
  locationReservationId: number;

  @Field()
  status?: LOCATION_RESERVATION_STATUS;
}
