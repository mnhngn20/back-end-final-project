import { EquipmentType } from "../../../entities";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class EquipmentTypeResponse implements IResponse {
  message: string;

  @Field((_type) => EquipmentType, { nullable: true })
  equipmentType?: EquipmentType;
}
