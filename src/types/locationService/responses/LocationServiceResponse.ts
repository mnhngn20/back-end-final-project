import { LocationService } from "../../../entities";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class LocationServiceResponse implements IResponse {
  message: string;

  @Field((_type) => LocationService, { nullable: true })
  locationService?: LocationService;
}
