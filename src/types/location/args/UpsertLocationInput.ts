import { Field, InputType } from "type-graphql";
import { LocationContactInformationInput } from "./LocationContactInformationsInput";

@InputType()
export class UpsertLocationInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  images?: string;

  @Field({ nullable: true })
  minPrice?: number;

  @Field({ nullable: true })
  thumbnail?: string;

  @Field({ nullable: true })
  electricCounterPrice: number;

  @Field()
  numOfFloor: number;

  @Field({ nullable: true })
  lat?: number;

  @Field({ nullable: true })
  long?: number;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  isActive?: boolean = true;

  @Field(() => [LocationContactInformationInput], { nullable: true })
  contactInformations?: LocationContactInformationInput[];

  @Field(() => [Number], { nullable: true })
  locationServiceIds?: number[];
}
