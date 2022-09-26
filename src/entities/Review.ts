import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Reservation } from "./Reservation";
import { Room } from "./Room";
import { User } from "./User";

@ObjectType()
@Entity()
export class Review extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  roomId!: number;

  @Field()
  @Column()
  reservationId!: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  content?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  images?: string;

  @Field()
  @Column()
  userId!: number;

  @Field()
  @Column()
  rate!: number;

  @Field({ nullable: true })
  @ManyToOne((_type) => User, { nullable: true })
  user?: User;

  @Field((_type) => Room, { nullable: true })
  @ManyToOne(() => Room, (room) => room.reviews)
  room?: Room;

  @Field((_type) => Reservation, { nullable: true })
  @OneToOne(() => Reservation, (reservation) => reservation.review)
  @JoinColumn()
  reservation?: Reservation;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
