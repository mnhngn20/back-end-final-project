import { Field, InterfaceType } from "type-graphql";

@InterfaceType()
export abstract class ListResponse {
  @Field({ nullable: true })
  page: number;

  @Field({ nullable: true })
  total: number;

  @Field({ nullable: true })
  totalPages: number;

  @Field({ nullable: true })
  message: string;
}
