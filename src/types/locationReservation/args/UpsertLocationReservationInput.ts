import { LOCATION_RESERVATION_STATUS } from "../../../constants";
import { Field, InputType } from "type-graphql";

@InputType()
export class UpsertLocationReservationInput {
  @Field({ nullable: true })
  id?: number;

  @Field()
  locationId: number;

  @Field()
  createdById: number;

  @Field((_type) => LOCATION_RESERVATION_STATUS, { nullable: true })
  status?: LOCATION_RESERVATION_STATUS = LOCATION_RESERVATION_STATUS.Draft;

  @Field()
  startDate: Date;
}
