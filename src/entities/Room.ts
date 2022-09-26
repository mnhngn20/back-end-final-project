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
import { RentedPerDayByRoom } from "./RentedPerDayByRoom";
import { Reservation } from "./Reservation";
import { Equipment } from "./Equipment";
import { RoomType } from "./RoomType";
import { Location } from "./Location";
import { Review } from "./Review";

@ObjectType()
@Entity()
export class Room extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  roomTypeId!: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  name?: string;

  @Field()
  @Column()
  floor: number;

  @Field()
  @Column()
  locationId!: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: String;

  @Field({ nullable: true })
  @Column({ nullable: true })
  image?: String;

  @Field()
  @Column()
  capacity: number = 1;

  @Field()
  @Column()
  status: boolean = true;

  @Field()
  @Column()
  basePrice: number;

  @Field()
  @Column()
  numberOfReviews: number = 0;

  @Field()
  @Column()
  overallRate: number = 5;

  @Field((_type) => RoomType, { nullable: true })
  @ManyToOne(() => RoomType, (roomType) => roomType.rooms)
  roomType: RoomType;

  @Field((_type) => Location, { nullable: true })
  @ManyToOne(() => Location, (location) => location.rooms)
  location: Location;

  @Field((_type) => [Equipment], { nullable: true })
  @OneToMany(() => Equipment, (equipment) => equipment.room)
  equipments: Equipment[];

  @Field((_type) => [RentedPerDayByRoom], { nullable: true })
  @OneToMany(() => RentedPerDayByRoom, (rentedPerDay) => rentedPerDay.room)
  rentedPerDays: RentedPerDayByRoom[];

  @Field((_type) => [Reservation], { nullable: true })
  @OneToMany(() => Reservation, (reservation) => reservation.room)
  reservations: Reservation[];

  @Field((_type) => [Review], { nullable: true })
  @OneToMany(() => Review, (review) => review.room)
  reviews: Review[];

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
