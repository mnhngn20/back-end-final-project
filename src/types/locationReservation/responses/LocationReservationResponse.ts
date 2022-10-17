import { LocationReservation } from "./../../../entities/LocationReservation";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class LocationReservationResponse implements IResponse {
  message: string;

  @Field((_type) => LocationReservation, { nullable: true })
  locationReservation?: LocationReservation;
}
