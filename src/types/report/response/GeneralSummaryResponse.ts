import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class GeneralSummaryResponse {
  @Field()
  totalReservation: number;

  @Field()
  totalNewUser: number;

  @Field()
  totalLocation: number;

  @Field()
  totalCustomer: number;
}
