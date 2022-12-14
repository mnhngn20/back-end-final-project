import { Incident } from "./Incident";
import { ROOM_STATUS } from "../constants";
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
import { Equipment } from "./Equipment";
import { Location } from "./Location";
import { User } from "./User";
import { Payment } from "./Payment";

@ObjectType()
@Entity()
export class Room extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  floor?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  capacity?: number = 1;

  @Field()
  @Column()
  locationId: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  images?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  thumbnail?: string;

  @Field((_type) => ROOM_STATUS)
  @Column({
    type: "enum",
    enum: ROOM_STATUS,
    default: ROOM_STATUS.Available,
  })
  status: ROOM_STATUS;

  @Field()
  @Column()
  basePrice: number;

  @Field((_type) => Location, { nullable: true })
  @ManyToOne(() => Location, (location) => location.rooms)
  location: Location;

  @Field((_type) => [User], { nullable: true })
  @OneToMany(() => User, (user) => user.room)
  users?: User[];

  @Field((_type) => [Equipment], { nullable: true })
  @OneToMany(() => Equipment, (equipment) => equipment.room)
  equipments: Equipment[];

  @Field((_type) => [Incident], { nullable: true })
  @OneToMany(() => Incident, (incident) => incident.room)
  incidents: Incident[];

  @Field((_type) => [Payment], { nullable: true })
  @OneToMany(() => Payment, (payment) => payment.room)
  payments: Payment[];

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
