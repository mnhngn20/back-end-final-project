import { Field, ObjectType } from "type-graphql";
import { ReportChart } from "./ReportChart";

@ObjectType()
export class ReportsResponse {
  @Field()
  message: string;

  @Field((_type) => [ReportChart])
  items: ReportChart[];
}
