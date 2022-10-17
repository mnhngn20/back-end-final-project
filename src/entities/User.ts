import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Location } from "./Location";
import { USER_ROLE } from "../constants";
import { Room } from "./Room";
import { Payment } from "./Payment";
import { LocationReservation } from "./LocationReservation";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  phoneNumber?: string;

  @Field()
  @Column({ type: "timestamptz" })
  dateOfBirth: Date;

  @Field((_type) => USER_ROLE)
  @Column({
    type: "enum",
    enum: USER_ROLE,
    default: USER_ROLE.Customer,
  })
  role: USER_ROLE;

  @Field({ nullable: true })
  @Column({ nullable: true })
  identityNumber?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  isActive?: boolean = true;

  @Column()
  password: string;

  @Field((_type) => [Payment], { nullable: true })
  @OneToMany(() => Payment, (payment) => payment.location)
  payments: Payment[];

  @Field((_type) => [LocationReservation], { nullable: true })
  @OneToMany(
    () => LocationReservation,
    (locationReservation) => locationReservation.createdBy
  )
  locationReservations: LocationReservation[];

  @Field((_type) => Location, { nullable: true })
  @ManyToOne(() => Location, (location) => location.users)
  location?: Location;

  @Field({ nullable: true })
  @Column({ nullable: true })
  locationId?: number;

  @Field((_type) => Room, { nullable: true })
  @OneToOne(() => Room, (room) => room.user)
  @JoinColumn({ name: "roomId" })
  room?: Room;

  @Field({ nullable: true })
  @Column({ nullable: true })
  roomId?: number;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
