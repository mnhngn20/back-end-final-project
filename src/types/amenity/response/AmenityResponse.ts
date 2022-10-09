import { Amenity } from "../../../entities";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class AmenityResponse implements IResponse {
  message: string;

  @Field((_type) => Amenity, { nullable: true })
  amenity?: Amenity;
}
