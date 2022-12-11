import { ContactResponse } from "./../types/contact/response/ContactResponse";
import { UpsertContactInput } from "./../types/contact/args/UpsertContactInput";
import { GetContactsInput } from "./../types/contact/args/GetContactsInput";
import { Location } from "./../entities/Location";
import { Arg, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { ContactInformation } from "../entities";
import { OutOfBoundsError } from "../types/Errors";
import { authMiddleware } from "../middlewares/auth-middleware";
import { ILike } from "typeorm";
import { ContactListResponse } from "../types/contact";

@Resolver()
export class ContactInformationResolver {
  @Query((_returns) => ContactListResponse)
  async getLocationContacts(
    @Arg("input")
    {
      limit,
      page,
      orderBy,
      name,
      address,
      email,
      locationId,
      phoneNumber,
    }: GetContactsInput
  ): Promise<ContactListResponse> {
    try {
      let options = {
        ...(name && { name: ILike(`%${name}%`) }),
        ...(address && { address: ILike(`%${address}%`) }),
        ...(email && { email: ILike(`%${email}%`) }),
        ...(phoneNumber && { phoneNumber: ILike(`%${phoneNumber}%`) }),
        ...(locationId && { locationId }),
      };

      const [result, total] = await ContactInformation.findAndCount({
        order: { createdAt: orderBy },
        take: limit,
        where: options,
        skip: (page - 1) * limit,
        relations: ["location"],
      });

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get Location Contacts successfully",
        items: result,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_returns) => ContactResponse)
  @UseMiddleware(authMiddleware)
  async upsertContact(
    @Arg("input")
    { id, locationId, ...rest }: UpsertContactInput
  ): Promise<ContactResponse> {
    try {
      if (id) {
        // UPDATE SECTION
        const existingContact = await ContactInformation.findOne({
          where: { id },
        });
        if (!existingContact) throw new Error("Contact Not Found");

        if (locationId) {
          const existingLocation = await Location.findOne({
            where: { id: locationId },
          });

          if (!existingLocation) {
            throw new Error("Location Not Found");
          }
          existingContact.locationId = locationId;
        }

        ContactInformation.merge(existingContact, {
          ...rest,
        });

        return {
          message: "Update Contact successfully",
          contact: await existingContact.save(),
        };
      } else {
        // CREATE SECTION
        if (!locationId) {
          throw new Error("Must include locationId");
        }

        const existingLocation = await Location.findOne({
          where: { id: locationId },
        });

        if (!existingLocation) {
          throw new Error("Location Not Found");
        }

        const newContact = await ContactInformation.create({
          ...rest,
          locationId,
        });

        return {
          message: "Create Contact successfully",
          contact: await newContact.save(),
        };
      }
    } catch (error) {
      throw new Error(error);
    }
  }
  @Mutation(() => String)
  @UseMiddleware(authMiddleware)
  async deleteContact(@Arg("id") id: number): Promise<string> {
    try {
      const existingContact = await ContactInformation.findOne({
        where: {
          id,
        },
      });

      if (!existingContact) {
        throw new Error("Contact not found!");
      }

      await ContactInformation.delete(existingContact.id);

      return "Deleted Contact successfully";
    } catch (error) {
      throw new Error(error);
    }
  }
}
