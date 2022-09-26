import { Equipment } from "../../../entities";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class EquipmentResponse implements IResponse {
  message: string;

  @Field((_type) => Equipment, { nullable: true })
  equipment?: Equipment;
}
