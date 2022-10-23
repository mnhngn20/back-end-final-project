import { IncidentCategory } from "./../entities/IncidentCategory";
import { Incident } from "./../entities/Incident";
import { Location } from "./../entities/Location";
import { Arg, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import {
  GetIncidentsInput,
  IncidentListResponse,
  IncidentResponse,
  UpsertIncidentInput,
  UpdateIncidentCustomerInput,
} from "../types/incident";
import { User, Room } from "../entities";
import { OutOfBoundsError } from "../types/Errors";
import { authMiddleware } from "../middlewares/auth-middleware";
import { ILike, MoreThanOrEqual } from "typeorm";

@Resolver()
export class IncidentResolver {
  @Query((_returns) => IncidentResponse)
  async getIncident(@Arg("id") id: number): Promise<IncidentResponse> {
    try {
      const existingIncident = await Incident.findOne({
        where: { id },
        relations: [
          "location",
          "incidentCategory",
          "reporter",
          "employee",
          "room",
        ],
      });

      if (!existingIncident) throw new Error("Incident Not Found");

      return {
        message: "Get Incident successfully",
        incident: existingIncident,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_returns) => IncidentListResponse)
  async getIncidents(
    @Arg("input")
    {
      limit,
      page,
      orderBy,
      dueDate,
      employeeId,
      fromCustomer,
      incidentCategoryId,
      locationId,
      priority,
      reporterId,
      roomId,
      status,
      title,
    }: GetIncidentsInput
  ): Promise<IncidentListResponse> {
    try {
      let options = {
        ...(dueDate && {
          dueDate: MoreThanOrEqual(dueDate),
        }),
        ...(employeeId && { employeeId }),
        ...(locationId && { locationId }),
        ...(incidentCategoryId && { incidentCategoryId }),
        ...(reporterId && { reporterId }),
        ...(roomId && { roomId }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(title && { title: ILike(`%${title}%`) }),
        ...(fromCustomer !== undefined &&
          fromCustomer !== null && { fromCustomer }),
      };

      const [result, total] = await Incident.findAndCount({
        order: { createdAt: orderBy },
        take: limit,
        where: options,
        skip: (page - 1) * limit,
        relations: [
          "location",
          "incidentCategory",
          "reporter",
          "employee",
          "room",
        ],
      });

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get Incidents successfully",
        items: result,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => IncidentResponse)
  @UseMiddleware(authMiddleware)
  async updateIncidentStatus(
    @Arg("input")
    { id, ...rest }: UpdateIncidentCustomerInput
  ): Promise<IncidentResponse> {
    try {
      const existingIncident = await Incident.findOne({ where: { id } });
      if (!existingIncident) {
        throw new Error("Incident Not Found!");
      }

      Incident.merge(existingIncident, { ...rest });

      return {
        message: "Update Incident successfully!",
        incident: await existingIncident.save(),
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => IncidentResponse)
  @UseMiddleware(authMiddleware)
  async upsertIncident(
    @Arg("input")
    {
      id,
      employeeId,
      locationId,
      incidentCategoryId,
      reporterId,
      roomId,
      ...rest
    }: UpsertIncidentInput
  ): Promise<IncidentResponse> {
    try {
      const existingIncidentCategory = await IncidentCategory.findOne({
        where: { id: incidentCategoryId },
      });
      console.log(existingIncidentCategory);

      if (!existingIncidentCategory)
        throw new Error("Incident Category Not Found");

      const existingLocation = await Location.findOne({
        where: { id: locationId },
      });
      if (!existingLocation) throw new Error("Location Not Found");

      const existingCustomer = await User.findOne({
        where: { id: reporterId },
      });
      if (!existingCustomer) throw new Error("Customer Not Found");

      if (employeeId) {
        const existingEmployee = await User.findOne({
          where: { id: employeeId },
        });
        if (!existingEmployee) throw new Error("Employee Not Found");
      }

      if (roomId) {
        const existingRoom = await Room.findOne({
          where: { id: roomId },
        });
        if (!existingRoom) throw new Error("Room Not Found");
      }

      if (id) {
        // UPDATE SECTION
        const existingIncident = await Incident.findOne({ where: { id } });
        if (!existingIncident) throw new Error("Incident Not Found");

        Incident.merge(existingIncident, {
          ...rest,
        });

        if (employeeId) {
          existingIncident.employeeId = employeeId;
        }

        if (roomId) {
          existingIncident.roomId = roomId;
        }

        if (incidentCategoryId) {
          existingIncident.incidentCategoryId = incidentCategoryId;
        }

        return {
          message: "Update Incident successfully",
          incident: await existingIncident.save(),
        };
      } else {
        // CREATE SECTION
        const newIncident = await Incident.create({
          ...rest,
          locationId,
          reporterId,
          incidentCategoryId,
        });

        if (employeeId) {
          newIncident.employeeId = employeeId;
        }

        if (roomId) {
          newIncident.roomId = roomId;
        }

        return {
          message: "Create Incident successfully!",
          incident: await newIncident.save(),
        };
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
