import { Field, InputType } from "type-graphql";
import {
  INCIDENT_PRIORITY,
  INCIDENT_STATUS,
  ORDER_BY,
} from "../../../constants";

@InputType()
export class GetIncidentsInput {
  @Field({ nullable: true })
  page: number = 1;

  @Field({ nullable: true })
  limit: number = 10;

  @Field((_type) => ORDER_BY, { nullable: true })
  orderBy: ORDER_BY = ORDER_BY.ASC;

  @Field({ nullable: true })
  locationId?: number;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  fromCustomer?: boolean;

  @Field(() => INCIDENT_PRIORITY, { nullable: true })
  priority?: INCIDENT_PRIORITY;

  @Field(() => INCIDENT_STATUS, { nullable: true })
  status?: INCIDENT_STATUS;

  @Field({ nullable: true })
  employeeId?: number;

  @Field({ nullable: true })
  reporterId?: number;

  @Field({ nullable: true })
  roomId?: number;

  @Field({ nullable: true })
  incidentCategoryId?: number;

  @Field({ nullable: true })
  dueDate?: Date;
}
