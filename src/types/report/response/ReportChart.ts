import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class ReportChart {
  @Field()
  date: Date;

  @Field()
  value: number;
}
