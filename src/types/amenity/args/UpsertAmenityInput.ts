import { Field, InputType } from "type-graphql";

@InputType()
export class UpsertAmenityInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  icon?: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  amenityTypeId: number;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  locationId?: number;
}
