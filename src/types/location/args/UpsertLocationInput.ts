import { Field, InputType } from "type-graphql";

@InputType()
export class UpsertLocationInput {
  @Field({ nullable: true })
  id?: number;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  status?: boolean = true;
}
