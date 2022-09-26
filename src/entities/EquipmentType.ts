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
import { Equipment } from "./Equipment";
import { Location } from "./Location";

@ObjectType()
@Entity()
export class EquipmentType extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  locationId?: number;

  @Field()
  @Column()
  name!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field((_type) => [Equipment], { nullable: true })
  @OneToMany(() => Equipment, (equipments) => equipments.equipmentType)
  equipments: Equipment[];

  @Field((_type) => Location, { nullable: true })
  @ManyToOne(() => Location, (location) => location.equipmentTypes)
  location: Location;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
