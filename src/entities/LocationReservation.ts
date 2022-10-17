import { LOCATION_RESERVATION_STATUS } from "./../constants";
import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Location } from "./Location";
import { Payment } from "./Payment";
import { User } from "./User";

@ObjectType()
@Entity()
export class LocationReservation extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  totalCalculatedPrice?: number;

  @Field()
  @Column({
    type: "enum",
    enum: LOCATION_RESERVATION_STATUS,
    default: LOCATION_RESERVATION_STATUS.Draft,
  })
  status?: LOCATION_RESERVATION_STATUS;

  @Field()
  @Column()
  totalReceivedPrice?: number;

  @Field()
  @Column()
  startDate?: Date;

  @Field()
  @Column()
  createdById: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.locationReservations)
  createdBy: User;

  @Field()
  @Column()
  locationId: number;

  @Field(() => Location)
  @ManyToOne(() => Location, (location) => location.locationReservations)
  location: Location;

  @Field((_type) => [Payment], { nullable: true })
  @OneToMany(() => Payment, (payment) => payment.location)
  payments: Payment[];

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
