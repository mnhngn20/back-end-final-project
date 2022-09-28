import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Room } from "./Room";
import { ContactInformation } from "./ContactInformation";
import { Equipment } from "./Equipment";

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

  @Field()
  @Column()
  long: number;

  @Field()
  @Column()
  lat: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  images?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  thumbnail?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field()
  @Column()
  income: number = 0;

  @Field()
  @Column()
  isActive: boolean = true;

  // @Field((_type) => [Reservation], { nullable: true })
  // @OneToMany(() => Reservation, (reservation) => reservation.location)
  // reservations: Reservation[];

  // @Field((_type) => [Promotion], { nullable: true })
  // @OneToMany(() => Promotion, (promotion) => promotion.location)
  // promotions: Promotion[];

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
  @OneToMany(() => User, (user) => user.location)
  users: User[];

  @Field((_type) => [Equipment], { nullable: true })
  @OneToMany(() => Equipment, (equipment) => equipment.location)
  equipments: Equipment[];

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
