import { IncidentCategory } from "../../../entities/IncidentCategory";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class IncidentCategoryResponse implements IResponse {
  message: string;

  @Field((_type) => IncidentCategory, { nullable: true })
  incidentCategory?: IncidentCategory;
}
