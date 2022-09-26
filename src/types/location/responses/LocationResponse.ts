import { Location } from "../../../entities";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class LocationResponse implements IResponse {
  message: string;

  @Field((_type) => Location, { nullable: true })
  location?: Location;
}
