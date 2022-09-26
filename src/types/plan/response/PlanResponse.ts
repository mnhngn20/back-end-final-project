import { Plan } from "../../../entities";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class PlanResponse implements IResponse {
  message: string;

  @Field((_type) => Plan, { nullable: true })
  plan?: Plan;
}
