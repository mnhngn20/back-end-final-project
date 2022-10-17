import { Field, InputType } from "type-graphql";
import { LOCATION_RESERVATION_STATUS, ORDER_BY } from "../../../constants";

@InputType()
export class GetLocationReservationsInput {
  @Field({ nullable: true })
  page: number = 1;

  @Field({ nullable: true })
  limit: number = 10;

  @Field((_type) => ORDER_BY, { nullable: true })
  orderBy: ORDER_BY = ORDER_BY.ASC;

  @Field((_type) => LOCATION_RESERVATION_STATUS, { nullable: true })
  status?: LOCATION_RESERVATION_STATUS;

  @Field({ nullable: true })
  locationId?: number;

  @Field({ nullable: true })
  fromDate?: Date;

  @Field({ nullable: true })
  toDate?: Date;

  @Field({ nullable: true })
  createdById?: number;
}
