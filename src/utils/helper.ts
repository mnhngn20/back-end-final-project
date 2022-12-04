import { IncidentCategory } from "./../entities/IncidentCategory";

export const createEquipmentReportIncidentCategory = async () => {
  try {
    const existingEquipment = await IncidentCategory.findOne({
      where: {
        name: "Equipment Report",
      },
    });
    if (!existingEquipment) {
      return await IncidentCategory.save(
        IncidentCategory.create({
          name: "Equipment Report",
          description: "Equipment Report",
          isActive: true,
        })
      );
    } else return existingEquipment;
  } catch (error) {
    throw new Error(error);
  }
};
