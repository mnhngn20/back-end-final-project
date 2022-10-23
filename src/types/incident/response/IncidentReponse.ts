import { Incident } from "../../../entities";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class IncidentResponse implements IResponse {
  message: string;

  @Field((_type) => Incident, { nullable: true })
  incident?: Incident;
}
