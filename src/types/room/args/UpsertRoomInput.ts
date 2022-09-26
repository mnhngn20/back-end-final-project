import { Field, InputType } from "type-graphql";

@InputType()
export class UpsertRoomInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  locationId?: number;

  @Field({ nullable: true })
  roomTypeId?: number;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  floor?: number;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  capacity?: number;

  @Field({ nullable: true })
  status?: boolean;

  @Field({ nullable: true })
  basePrice?: number;
}
