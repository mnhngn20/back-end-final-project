import { AmenityType } from "./../../../entities/AmenityType";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class AmenityTypeResponse implements IResponse {
  message: string;

  @Field((_type) => AmenityType, { nullable: true })
  amenityType?: AmenityType;
}
