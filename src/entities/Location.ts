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
import { Reservation } from "./Reservation";
import { User } from "./User";
import { Room } from "./Room";
import { Promotion } from "./Promotion";
import { RoomType } from "./RoomType";
import { EquipmentType } from "./EquipmentType";

@ObjectType()
@Entity()
export class Location extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name!: string;

  @Field()
  @Column()
  address!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field()
  @Column()
  income: number = 0;

  @Field()
  @Column()
  status: boolean = true;

  @Field((_type) => [Reservation], { nullable: true })
  @OneToMany(() => Reservation, (reservation) => reservation.location)
  reservations: Reservation[];

  @Field((_type) => [Promotion], { nullable: true })
  @OneToMany(() => Promotion, (promotion) => promotion.location)
  promotions: Promotion[];

  @Field((_type) => [RoomType], { nullable: true })
  @OneToMany(() => RoomType, (roomType) => roomType.location)
  roomTypes: RoomType[];

  @Field((_type) => [EquipmentType], { nullable: true })
  @OneToMany(() => EquipmentType, (equipmentType) => equipmentType.location)
  equipmentTypes: EquipmentType[];

  @Field((_type) => [Room], { nullable: true })
  @OneToMany(() => Room, (room) => room.location)
  rooms: Room[];

  @Field((_type) => [User], { nullable: true })
  @OneToMany(() => User, (user) => user.location)
  users: User[];

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
