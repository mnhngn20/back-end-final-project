import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Room } from "./Room";
import { User } from "./User";
import { Location } from "./Location";
import { PAYMENT_METHOD, RESERVATION_STATUS } from "../constants";
import { Review } from "./Review";
import { Plan } from "./Plan";
import { Promotion } from "./Promotion";

@ObjectType()
@Entity()
export class Reservation extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  userId: number;

  @Field()
  @Column()
  roomId: number;

  @Field((_type) => RESERVATION_STATUS)
  @Column({
    type: "enum",
    enum: RESERVATION_STATUS,
    default: RESERVATION_STATUS.Unpaid,
  })
  status: RESERVATION_STATUS;

  @Field((_type) => PAYMENT_METHOD)
  @Column({
    type: "enum",
    enum: PAYMENT_METHOD,
  })
  paymentMethod: PAYMENT_METHOD;

  @Field()
  @Column()
  locationId: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  promotionId?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  creatorId?: number;

  @Field()
  @Column({ type: "timestamptz" })
  fromDate!: Date;

  @Field()
  @Column({ type: "timestamptz" })
  toDate!: Date;

  @Field()
  @Column()
  planId: number;

  @Field()
  @Column()
  totalPrice: number;

  @Field()
  @Column()
  finalPrice: number;

  @Field()
  @Column()
  hasReviewed: boolean = false;

  @Field((_type) => Room, { nullable: true })
  @ManyToOne(() => Room, (room) => room.reservations)
  room?: Room;

  @Field((_type) => Review, { nullable: true })
  @OneToOne(() => Review, (review) => review.reservation)
  review?: Review;

  @Field((_type) => Location, { nullable: true })
  @ManyToOne(() => Location, (location) => location.reservations)
  location?: Location;

  @Field((_type) => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.reservations)
  user?: User;

  @Field((_type) => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.reservationsCreatedForCustomer)
  creator?: User;

  @Field((_type) => Plan, { nullable: true })
  @ManyToOne(() => Plan, (plan) => plan.reservations)
  plan?: Plan;

  @Field((_type) => Promotion, { nullable: true })
  @ManyToOne(() => Promotion, (promotion) => promotion.reservations)
  promotion?: Promotion;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
