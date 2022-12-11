import { ContactInformation } from "./../../../entities/ContactInformation";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class ContactResponse implements IResponse {
  message: string;

  @Field((_type) => ContactInformation, { nullable: true })
  contact?: ContactInformation;
}
