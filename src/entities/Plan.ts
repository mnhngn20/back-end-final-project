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
import { RoomType } from "./RoomType";

@ObjectType()
@Entity()
export class Plan extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field()
  @Column()
  roomTypeId: number;

  @Field()
  @Column({ type: "float" })
  multiplicationFactor: number = 1.0;

  @Field()
  @Column()
  numOfDays: number = 1;

  @Field()
  @Column()
  status: boolean = true;

  @Field((_type) => RoomType)
  @ManyToOne(() => RoomType, (roomType) => roomType.plans)
  roomType?: RoomType;

  @Field((_type) => [Reservation], { nullable: true })
  @OneToMany(() => Reservation, (reservation) => reservation.plan)
  reservations?: Reservation[];

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
