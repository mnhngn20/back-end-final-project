import { Room } from "../../../entities";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class RoomResponse implements IResponse {
  message?: string;

  @Field({ nullable: true })
  room?: Room;
}
