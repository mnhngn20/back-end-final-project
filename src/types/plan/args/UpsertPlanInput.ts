import { Field, InputType } from "type-graphql";

@InputType()
export class UpsertPlanInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  roomTypeId?: number;

  @Field({ nullable: true })
  multiplicationFactor?: number;

  @Field({ nullable: true })
  numOfDays?: number;

  @Field({ nullable: true })
  status?: boolean;
}
