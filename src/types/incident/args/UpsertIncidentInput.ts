import { INCIDENT_PRIORITY, INCIDENT_STATUS } from "./../../../constants";
import { Field, InputType } from "type-graphql";

@InputType()
export class UpsertIncidentInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  fromCustomer?: boolean;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field({ nullable: true })
  images?: string;

  @Field({ nullable: true })
  reportImages?: string;

  @Field({ nullable: true })
  reportMessage?: string;

  @Field({ nullable: true })
  roomId?: number;

  @Field({ nullable: true })
  equipmentId?: number;

  @Field({ nullable: true })
  isEquipmentReport?: boolean;

  @Field(() => INCIDENT_STATUS, { nullable: true })
  status?: INCIDENT_STATUS;

  @Field(() => INCIDENT_PRIORITY, { nullable: true })
  priority?: INCIDENT_PRIORITY;

  @Field({ nullable: true })
  employeeId?: number;

  @Field()
  reporterId: number;

  @Field({ nullable: true })
  incidentCategoryId?: number;

  @Field()
  locationId: number;
}
