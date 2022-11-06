import { NOTIFICATION_TYPE } from "./../constants";
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
import { Location } from "./Location";
import { User } from "./User";

@ObjectType()
@Entity()
export class Notification extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  content?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  isAdminOnly?: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  dataId?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  isRead?: boolean = false;

  @Field({ nullable: true })
  @Column({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  @Column({
    type: "enum",
    enum: NOTIFICATION_TYPE,
    default: NOTIFICATION_TYPE.Other,
    nullable: true,
  })
  type?: NOTIFICATION_TYPE;

  @Field()
  @Column()
  userId: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user?.notification)
  user: User;

  @Field({ nullable: true })
  @Column({ nullable: true })
  locationId: number;

  @Field(() => Location, { nullable: true })
  @ManyToOne(() => Location, (location) => location.amenities, {
    nullable: true,
  })
  location: Location;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
