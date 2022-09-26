import { Reservation } from "../../../entities";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class ReservationResponse implements IResponse {
  message: string;

  @Field((_type) => Reservation, { nullable: true })
  reservation?: Reservation;
}
