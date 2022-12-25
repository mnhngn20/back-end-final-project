import { createEquipmentReportIncidentCategory } from "./../utils/helper";
import { Equipment } from "./../entities/Equipment";
import dayjs from "dayjs";
import { IncidentCategory } from "./../entities/IncidentCategory";
import { Incident } from "./../entities/Incident";
import { Location } from "./../entities/Location";
import { Arg, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import {
  GetIncidentsInput,
  IncidentListResponse,
  IncidentResponse,
  UpsertIncidentInput,
  UpdateIncidentForEmployeeInput,
} from "../types/incident";
import { User, Room } from "../entities";
import { OutOfBoundsError } from "../types/Errors";
import { authMiddleware } from "../middlewares/auth-middleware";
import { ILike, MoreThanOrEqual } from "typeorm";
import { INCIDENT_STATUS, NOTIFICATION_TYPE, USER_ROLE } from "../constants";
import { createAndPushNotification } from "../services/notification.service";

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
          "equipment",
        ],
      });

      if (
        existingIncident?.status !== INCIDENT_STATUS.ToDo &&
        existingIncident?.dueDate &&
        dayjs(existingIncident?.dueDate).diff(dayjs()) < 0
      ) {
        existingIncident.status = INCIDENT_STATUS.Overdue;
      } else if (
        existingIncident?.status === INCIDENT_STATUS.Overdue &&
        existingIncident?.dueDate &&
        dayjs(existingIncident?.dueDate).diff(dayjs()) > 0
      ) {
        existingIncident.status = INCIDENT_STATUS.ToDo;
      }

      if (!existingIncident) throw new Error("Incident Not Found");

      return {
        message: "Get Incident successfully",
        incident: await existingIncident.save(),
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
        order: { updatedAt: orderBy },
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

      await Promise.all(
        result.map(async (incident) => {
          if (
            incident?.status === INCIDENT_STATUS.ToDo &&
            incident?.dueDate &&
            dayjs(incident?.dueDate).diff(dayjs()) < 0
          ) {
            incident.status = INCIDENT_STATUS.Overdue;
            await incident.save();
          } else if (
            incident?.status === INCIDENT_STATUS.Overdue &&
            incident?.dueDate &&
            dayjs(incident?.dueDate).diff(dayjs()) > 0
          ) {
            incident.status = INCIDENT_STATUS.ToDo;
          }
        })
      );

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
  async updateIncidentForEmployee(
    @Arg("input")
    { id, status, ...rest }: UpdateIncidentForEmployeeInput
  ): Promise<IncidentResponse> {
    try {
      const existingIncident = await Incident.findOne({
        where: { id },
        relations: ["employee", "reporter", "equipment"],
      });
      if (!existingIncident) {
        throw new Error("Incident Not Found!");
      }
      if (status) {
        if (status === INCIDENT_STATUS.Done) {
          if (!existingIncident.employeeId)
            throw new Error("Incident cannot complete with employee");
          const completedDate = dayjs().toDate();
          existingIncident.completedDate = completedDate;

          if (existingIncident.equipment?.id) {
            const existingEquipment = await Equipment.findOne({
              where: { id: existingIncident.equipment?.id },
            });

            if (!existingEquipment) {
              throw new Error("Equipment Not Found");
            }

            existingEquipment.isActive = true;
            await existingEquipment.save();
          }

          createAndPushNotification(
            {
              content: `${existingIncident?.employee?.name} has completed your incident. Thank you for reporting!`,
              title: `Complete Incident`,
              type: NOTIFICATION_TYPE.Incident,
              userId: existingIncident?.reporterId,
              dataId: existingIncident?.id,
            },
            [existingIncident.reporter]
          );
        } else {
          if (status === INCIDENT_STATUS.Cancel) {
            createAndPushNotification(
              {
                content: `${existingIncident?.employee?.name} has cancelled your incident.`,
                title: `Incident Cancelled`,
                type: NOTIFICATION_TYPE.Incident,
                userId: existingIncident?.reporterId,
                dataId: existingIncident?.id,
              },
              [existingIncident.reporter]
            );
          }
          if (status === INCIDENT_STATUS.InProgress) {
            createAndPushNotification(
              {
                content: `${existingIncident?.employee?.name} is handling your incident. Please be patient`,
                title: `Incident In Progress`,
                type: NOTIFICATION_TYPE.Incident,
                userId: existingIncident?.reporterId,
                dataId: existingIncident?.id,
              },
              [existingIncident.reporter]
            );
          }
        }
        existingIncident.status = status;
      }

      Incident.merge(existingIncident, { ...rest });
      if (rest.employeeId) {
        const existingEmployee = await User.findOne({
          where: { id: rest.employeeId },
        });
        if (!existingEmployee) {
          throw new Error("Employee Not Found");
        }
        existingIncident.employeeId = rest.employeeId;
        existingIncident.employee = existingEmployee;
      }

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
      status,
      fromCustomer,
      equipmentId,
      isEquipmentReport,
      ...rest
    }: UpsertIncidentInput
  ): Promise<IncidentResponse> {
    try {
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
        const existingIncident = await Incident.findOne({
          where: { id },
          relations: ["employee", "reporter", "equipment"],
        });
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

        if (status) {
          if (status === INCIDENT_STATUS.Done) {
            if (!existingIncident.employeeId)
              throw new Error("Incident cannot complete with employee");
            const completedDate = dayjs().toDate();
            existingIncident.completedDate = completedDate;

            if (existingIncident.equipment?.id) {
              const existingEquipment = await Equipment.findOne({
                where: { id: existingIncident.equipment?.id },
              });

              if (!existingEquipment) {
                throw new Error("Equipment Not Found");
              }

              existingEquipment.isActive = true;
              await existingEquipment.save();
            }

            createAndPushNotification(
              {
                content: `${existingIncident?.employee?.name} has completed your incident. Thank you for reporting!`,
                title: `Complete Incident`,
                type: NOTIFICATION_TYPE.Incident,
                userId: existingIncident?.reporterId,
                dataId: existingIncident?.id,
              },
              [existingIncident.reporter]
            );
          }
          existingIncident.status = status;
        }

        return {
          message: "Update Incident successfully",
          incident: await existingIncident.save(),
        };
      } else {
        // CREATE SECTION
        const equipmentReportIncidentCategory =
          await createEquipmentReportIncidentCategory();

        const newIncident = await Incident.save(
          await Incident.create({
            ...rest,
            fromCustomer,
            locationId,
            reporterId,
            incidentCategoryId: equipmentReportIncidentCategory?.id,
            roomId,
          })
        );

        if (equipmentId && isEquipmentReport) {
          const existingEquipment = await Equipment.findOne({
            where: { id: equipmentId },
          });

          if (!existingEquipment) {
            throw new Error("Equipment Not Found");
          }
          newIncident.equipment = existingEquipment;
          existingEquipment.isActive = false;
          newIncident.isEquipmentReport = isEquipmentReport;
          await existingEquipment.save();
        } else if (incidentCategoryId) {
          const existingIncidentCategory = await IncidentCategory.findOne({
            where: { id: incidentCategoryId },
          });

          if (!existingIncidentCategory)
            throw new Error("Incident Category Not Found");
          newIncident.incidentCategoryId = existingIncidentCategory.id;
        }

        if (fromCustomer) {
          const locationAdmins = await User.find({
            where: { locationId: locationId, role: USER_ROLE.Admin },
          });

          const reporter = await User.findOne({ where: { id: reporterId } });
          locationAdmins?.forEach((admin) => {
            createAndPushNotification(
              {
                content: `${reporter?.name} created a new incident!`,
                title: `New Incident`,
                type: NOTIFICATION_TYPE.Incident,
                isAdminOnly: true,
                userId: admin?.id,
                dataId: newIncident?.id,
              },
              [admin]
            );
          });
        }

        if (employeeId) {
          newIncident.employeeId = employeeId;
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
