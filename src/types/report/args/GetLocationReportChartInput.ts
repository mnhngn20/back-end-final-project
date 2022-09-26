import { Field, InputType } from "type-graphql";

@InputType()
export class GetLocationReportChartInput {
  @Field({ nullable: true })
  locationId?: number;

  @Field()
  fromDate: Date;

  @Field()
  toDate: Date;
}
