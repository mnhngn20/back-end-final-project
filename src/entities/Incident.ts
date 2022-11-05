import { INCIDENT_PRIORITY } from "./../constants";
import { INCIDENT_STATUS } from "../constants";
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
import { IncidentCategory } from "./IncidentCategory";
import { Location } from "./Location";
import { User } from "./User";
import { Room } from "./Room";

@ObjectType()
@Entity()
export class Incident extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  fromCustomer?: boolean = true;

  @Field({ nullable: true })
  @Column({ nullable: true })
  dueDate?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  completedDate?: Date;

  @Field(() => INCIDENT_PRIORITY, { nullable: true })
  @Column({
    type: "enum",
    enum: INCIDENT_PRIORITY,
    default: INCIDENT_PRIORITY.Low,
    nullable: true,
  })
  priority?: INCIDENT_PRIORITY;

  @Field({ nullable: true })
  @Column({ nullable: true })
  images?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  reportImages?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  reportMessage?: string;

  @Field(() => INCIDENT_STATUS, { nullable: true })
  @Column({
    type: "enum",
    enum: INCIDENT_STATUS,
    default: INCIDENT_STATUS.ToDo,
    nullable: true,
  })
  status?: INCIDENT_STATUS = INCIDENT_STATUS.ToDo;

  @Field({ nullable: true })
  @Column({ nullable: true })
  employeeId: number;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (employee) => employee.employeeIncidents, {
    nullable: true,
  })
  employee: User;

  @Field()
  @Column()
  reporterId: number;

  @Field(() => User)
  @ManyToOne(() => User, (reporter) => reporter.reportIncidents)
  reporter: User;

  @Field()
  @Column()
  roomId: number;

  @Field(() => Room)
  @ManyToOne(() => Room, (room) => room.incidents)
  room: Room;

  @Field()
  @Column()
  incidentCategoryId: number;

  @Field(() => IncidentCategory)
  @ManyToOne(
    () => IncidentCategory,
    (incidentCategory) => incidentCategory.incidents
  )
  incidentCategory: IncidentCategory;

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
