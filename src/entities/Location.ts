import { LocationService } from "./LocationService";
import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Room } from "./Room";
import { ContactInformation } from "./ContactInformation";
import { Equipment } from "./Equipment";
import { Amenity } from "./Amenity";
import { GraphQLJSONObject } from "graphql-type-json";
import { Geometry } from "geojson";
import { Payment } from "./Payment";
import { LocationReservation } from "./LocationReservation";

@ObjectType()
@Entity()
export class Location extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  address: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  electricCounterPrice?: number = 0;

  @Field({ nullable: true })
  @Column({ type: "real", nullable: true })
  long?: number;

  @Field({ nullable: true })
  @Column({ type: "real", nullable: true })
  lat?: number;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @Column({
    type: "geometry",
    spatialFeatureType: "Point",
    srid: 4326,
    select: false,
    nullable: true,
  })
  geoLocation: Geometry;

  @Field({ nullable: true })
  @Column({ nullable: true })
  images?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  thumbnail?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  numOfFloor?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  minPrice?: number = 1000000;

  @Field()
  @Column()
  income: number = 0;

  @Field()
  @Column()
  isActive: boolean = true;

  @Field((_type) => [Room], { nullable: true })
  @OneToMany(() => Room, (room) => room.location)
  rooms: Room[];

  @Field((_type) => [ContactInformation], { nullable: true })
  @OneToMany(
    () => ContactInformation,
    (contactInformation) => contactInformation.location
  )
  contactInformations: ContactInformation[];

  @Field((_type) => [User], { nullable: true })
  @OneToMany(() => User, (user) => user.location, { nullable: true })
  users?: User[];

  @Field((_type) => [Equipment], { nullable: true })
  @OneToMany(() => Equipment, (equipment) => equipment.location)
  equipments: Equipment[];

  @Field(() => [LocationService])
  @ManyToMany(() => LocationService)
  @JoinTable()
  locationServices: LocationService[];

  @Field(() => [Amenity])
  @OneToMany(() => Amenity, (amenity) => amenity.location)
  amenities: Amenity[];

  @Field((_type) => [LocationReservation], { nullable: true })
  @OneToMany(
    () => LocationReservation,
    (locationReservation) => locationReservation.location
  )
  locationReservations: LocationReservation[];

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
