import { Review } from "../../../entities";
import { Field, ObjectType } from "type-graphql";
import { IResponse } from "../../Response";

@ObjectType({ implements: IResponse })
export class ReviewResponse implements IResponse {
  message: string;

  @Field((_type) => Review, { nullable: true })
  review?: Review;
}
