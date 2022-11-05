import { Field, InputType } from "type-graphql";
import { INCIDENT_PRIORITY, INCIDENT_STATUS } from "../../../constants";

@InputType()
export class UpdateIncidentForEmployeeInput {
  @Field()
  id: number;

  @Field(() => INCIDENT_STATUS)
  status?: INCIDENT_STATUS;

  @Field({ nullable: true })
  employeeId?: number;

  @Field({ nullable: true })
  reportMessage?: string;

  @Field({ nullable: true })
  reportImages?: string;

  @Field({ nullable: true })
  priority?: INCIDENT_PRIORITY;
}
