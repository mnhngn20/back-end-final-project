import { __Type } from "graphql";
import { PROMOTION_TYPE } from "../constants";
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

@ObjectType()
@Entity()
export class Promotion extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  locationId?: number;

  @Field()
  @Column()
  code: string;

  @Field((_type) => PROMOTION_TYPE)
  @Column({
    type: "enum",
    enum: PROMOTION_TYPE,
  })
  type: PROMOTION_TYPE;

  @Field()
  @Column({ type: "float" })
  amount: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field()
  @Column()
  isActive: boolean = true;

  @Field()
  @Column({ type: "timestamptz" })
  startDate: Date;

  @Field()
  @Column({ type: "timestamptz" })
  expirationDate: Date;

  @Field((_type) => [Reservation], { nullable: true })
  @OneToMany(() => Reservation, (reservation) => reservation.promotion)
  reservations?: Reservation[];

  @Field((_type) => Location, { nullable: true })
  @ManyToOne(() => Location, (location) => location.promotions)
  location?: Location;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
