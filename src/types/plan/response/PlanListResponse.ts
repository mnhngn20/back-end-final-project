import { Field, ObjectType } from "type-graphql";
import { Plan } from "../../../entities";

@ObjectType()
export class PlanListResponse {
  @Field()
  message: string;

  @Field((_type) => [Plan])
  items: Plan[];
}
