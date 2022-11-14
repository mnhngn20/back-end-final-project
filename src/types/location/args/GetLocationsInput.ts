import { Field, Float, InputType } from "type-graphql";

@InputType()
export class GetLocationsInput {
  @Field()
  limit: number = 10;

  @Field({ nullable: true })
  orderBy?: String;

  @Field()
  page: number = 1;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  address?: string;

  @Field(() => [Number], { nullable: true })
  locationServiceIds: number[];

  @Field(() => Float, { nullable: true })
  lat?: number;

  @Field(() => Float, { nullable: true })
  long?: number;

  @Field(() => Float, { nullable: true })
  distance?: number;

  @Field({ nullable: true })
  minPrice?: number;

  @Field({ nullable: true })
  maxPrice?: number;
}
