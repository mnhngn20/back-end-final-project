import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Room } from "./Room";

@ObjectType()
@Entity()
export class RentedPerDayByRoom extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  roomId!: number;

  @Field()
  @Column({ type: "timestamptz" })
  date!: Date;

  @Field()
  @Column()
  numOfRentals: number = 0;

  @Field((_type) => Room)
  @ManyToOne(() => Room, (room) => room.rentedPerDays)
  room: Room;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
