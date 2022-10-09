import { LocationService } from "./LocationService";
import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Room } from "./Room";
import { ContactInformation } from "./ContactInformation";
import { Equipment } from "./Equipment";
import { Amenity } from "./Amenity";

@ObjectType()
@Entity()
export class Location extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  address: string;

  @Field({ nullable: true })
  @Column({ type: "real", nullable: true })
  long?: number;

  @Field({ nullable: true })
  @Column({ type: "real", nullable: true })
  lat?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  images?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  thumbnail?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  numOfFloor?: number;

  @Field()
  @Column()
  income: number = 0;

  @Field()
  @Column()
  isActive: boolean = true;

  @Field((_type) => [Room], { nullable: true })
  @OneToMany(() => Room, (room) => room.location)
  rooms: Room[];

  @Field((_type) => [ContactInformation], { nullable: true })
  @OneToMany(
    () => ContactInformation,
    (contactInformation) => contactInformation.location
  )
  contactInformations: ContactInformation[];

  @Field((_type) => [User], { nullable: true })
  @OneToMany(() => User, (user) => user.location, { nullable: true })
  users?: User[];

  @Field((_type) => [Equipment], { nullable: true })
  @OneToMany(() => Equipment, (equipment) => equipment.location)
  equipments: Equipment[];

  @Field(() => [LocationService])
  @ManyToMany(
    () => LocationService,
    (locationService) => locationService.location
  )
  locationServices: LocationService[];

  @Field(() => [Amenity])
  @OneToMany(() => Amenity, (amenity) => amenity.location)
  amenities: Amenity[];

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
