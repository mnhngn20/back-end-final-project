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
import { Location } from "./Location";
import { USER_ROLE } from "../constants";
import { Room } from "./Room";

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

  @Field()
  @Column()
  address: string;

  @Field()
  @Column()
  phoneNumber: string;

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

  @Field()
  @Column()
  identityNumber?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  isActive?: boolean = true;

  @Field({ nullable: true })
  @Column({ nullable: true })
  locationId?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  roomId?: number;

  @Column()
  password: string;

  @Field((_type) => Location, { nullable: true })
  @ManyToOne(() => Location, (location) => location.users)
  location?: Location;

  @Field((_type) => Room, { nullable: true })
  @OneToOne(() => Room, (room) => room.user, { nullable: true })
  room?: Location;

  // @Field((_type) => [Reservation], { nullable: true })
  // @OneToMany(() => Reservation, (reservation) => reservation.user)
  // reservations: Reservation[];

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
