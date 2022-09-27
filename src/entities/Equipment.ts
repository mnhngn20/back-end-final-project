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
export class Equipment extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  roomId: number;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  image?: String;

  @Field()
  @Column()
  status: string;

  @Field((_type) => Room)
  @ManyToOne(() => Room, (room) => room.equipments)
  room: Room;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
