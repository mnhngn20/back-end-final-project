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
import { Reservation } from "./Reservation";
import { Location } from "./Location";
import { USER_ROLE } from "../constants";
import { Review } from "./Review";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  firebaseToken?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  fullName?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  identityNumber?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: "timestamptz" })
  dob?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  isActive: boolean = true;

  @Field()
  @Column()
  balance: number = 0;

  @Field((_type) => USER_ROLE)
  @Column({
    type: "enum",
    enum: USER_ROLE,
    default: USER_ROLE.Customer,
  })
  role: USER_ROLE;

  @Field({ nullable: true })
  @Column({ nullable: true })
  locationId?: number;

  @Column()
  password: string;

  @Field((_type) => [Review], { nullable: true })
  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @Field((_type) => Location, { nullable: true })
  @ManyToOne(() => Location, (location) => location.users)
  location?: Location;

  @Field((_type) => [Reservation], { nullable: true })
  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations: Reservation[];

  @Field((_type) => [Reservation], { nullable: true })
  @OneToMany(() => Reservation, (reservation) => reservation.creator)
  reservationsCreatedForCustomer: Reservation[];

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
