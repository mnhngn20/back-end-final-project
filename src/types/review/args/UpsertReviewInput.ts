import { Field, InputType } from "type-graphql";

@InputType()
export class UpsertReviewInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  images?: string;

  @Field({ nullable: true })
  content?: string;

  @Field({ nullable: true })
  rate?: number;

  @Field()
  reservationId: number;
}
