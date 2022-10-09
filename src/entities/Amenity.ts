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
import { AmenityType } from "./AmenityType";
import { Location } from "./Location";

@ObjectType()
@Entity()
export class Amenity extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  icon?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field()
  @Column()
  isActive: boolean = true;

  @Field()
  @Column()
  amenityTypeId: number;

  @Field(() => AmenityType)
  @ManyToOne(() => AmenityType, (amenityType) => amenityType.amenities)
  amenityType: AmenityType;

  @Field()
  @Column()
  locationId: number;

  @Field(() => Location)
  @ManyToOne(() => Location, (location) => location.amenities)
  location: Location;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
