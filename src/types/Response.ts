import { Field, InterfaceType } from "type-graphql";

@InterfaceType()
export abstract class IResponse {
  @Field({nullable: true})
  message?: string
}
