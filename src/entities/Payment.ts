import { DISCOUNT_TYPE, PAYMENT_STATUS } from "../constants";
import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Location } from "./Location";
import { Room } from "./Room";
import { User } from "./User";
import { LocationReservation } from "./LocationReservation";

@ObjectType()
@Entity()
export class Payment extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  totalPrice?: number = 0;

  @Field({ nullable: true })
  @Column({ nullable: true })
  electricCounter?: number = 0;

  @Field({ nullable: true })
  @Column({ nullable: true })
  waterPrice?: number = 0;

  @Field({ nullable: true })
  @Column({ nullable: true })
  discount?: number = 0;

  @Field(() => DISCOUNT_TYPE, { nullable: true })
  @Column({
    enum: DISCOUNT_TYPE,
    default: DISCOUNT_TYPE.FixedCashDiscount,
    type: "enum",
    nullable: true,
  })
  discountType?: DISCOUNT_TYPE;

  @Field(() => PAYMENT_STATUS)
  @Column({
    type: "enum",
    enum: PAYMENT_STATUS,
    default: PAYMENT_STATUS.Unpaid,
  })
  status: PAYMENT_STATUS;

  @Field(() => [User], { nullable: true })
  @ManyToMany(() => User, (user) => user.payments)
  users: User[];

  @Field()
  @Column()
  roomId: number;

  @Field(() => Room)
  @ManyToOne(() => Room, (room) => room.payments)
  room: Room;

  @Field()
  @Column()
  locationReservationId: number;

  @Field(() => LocationReservation)
  @ManyToOne(
    () => LocationReservation,
    (locationReservation) => locationReservation.payments
  )
  locationReservation: LocationReservation;

  @Field()
  @Column()
  locationId: number;

  @Field(() => Location)
  @ManyToOne(() => Location, (location) => location.payments)
  location: Location;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
