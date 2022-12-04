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
import { Incident } from "./Incident";
import { Location } from "./Location";
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
  locationId: number;

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
  isActive: boolean;

  @Field((_type) => Room)
  @ManyToOne(() => Room, (room) => room.equipments)
  room: Room;

  @Field((_type) => [Incident], { nullable: true })
  @OneToMany(() => Incident, (incident) => incident.equipment)
  incidents?: Incident[];

  @Field((_type) => Location)
  @ManyToOne(() => Location, (location) => location.equipments)
  location: Location;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
