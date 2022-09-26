import { Field, InputType } from "type-graphql";

@InputType()
export class GetGeneralReportChartInput {
  @Field()
  fromDate: Date;

  @Field()
  toDate: Date;
}
