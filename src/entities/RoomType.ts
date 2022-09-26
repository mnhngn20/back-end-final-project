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
import { Plan } from "./Plan";
import { Room } from "./Room";
import { Location } from "./Location";

@ObjectType()
@Entity()
export class RoomType extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  locationId?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field((_type) => [Room], { nullable: true })
  @OneToMany(() => Room, (room) => room.location)
  rooms: Room[];

  @Field((_type) => [Plan], { nullable: true })
  @OneToMany(() => Plan, (plan) => plan.roomType)
  plans: Plan[];

  @Field((_type) => Location, { nullable: true })
  @ManyToOne(() => Location, (location) => location.roomTypes)
  location: Location;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
