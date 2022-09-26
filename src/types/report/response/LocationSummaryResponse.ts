import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class LocationSummaryResponse {
  @Field()
  totalReservation: number;

  @Field()
  totalIncome: number;

  @Field()
  totalRoom: number;

  @Field()
  incomePerRoom: number;
}
