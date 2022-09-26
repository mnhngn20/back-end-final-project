import { RoomType } from "../../../entities";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class RoomTypeResponse implements IResponse {
  message: string;

  @Field((_type) => RoomType, { nullable: true })
  roomType?: RoomType;
}
