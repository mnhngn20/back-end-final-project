import { ROOM_STATUS } from "../../../constants";
import { Field, InputType } from "type-graphql";

@InputType()
export class UpsertRoomInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  locationId?: number;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  images?: string;

  @Field(() => ROOM_STATUS, { nullable: true })
  status?: ROOM_STATUS;

  @Field({ nullable: true })
  basePrice?: number;
}
