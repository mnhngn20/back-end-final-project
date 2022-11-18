import dayjs from "dayjs";
import { LocationReservation, Location, User } from "./../entities";
import { Payment } from "../entities";
import { CreateCheckoutSessionInput } from "../types/stripe";
import Stripe from "stripe";
import { NOTIFICATION_TYPE, PAYMENT_STATUS, USER_ROLE } from "../constants";
import { createAndPushNotification } from "./notification.service";

export class StripeService {
  readonly stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2022-08-01",
      typescript: true,
    });
  }

  async authorizeCode(code: string) {
    const response = await this.stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    return response.stripe_user_id;
  }
  public async createCheckoutSession({
    title,
    description,
    image,
    price,
    cancelUrl,
    successUrl,
    paymentId,
  }: CreateCheckoutSessionInput): Promise<
    Stripe.Response<Stripe.Checkout.Session>
  > {
    return await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "VND",
            product_data: {
              name: title,
              description: description,
              ...(image && {
                images: [image],
              }),
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        paymentId,
      },
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }

  public async transfer(accountId: string, amount: number) {
    return await this.stripe.transfers.create({
      amount: Math.round(amount / 23000),
      destination: accountId,
      currency: "usd",
    });
  }
}

export async function handlePayment(paymentId: string) {
  try {
    console.log("aaaaa");

    const stripeService = new StripeService();

    const existingPayment = await Payment.findOne({
      where: {
        id: Number(paymentId),
      },
      relations: ["location", "room", "locationReservation"],
    });

    if (!existingPayment) {
      throw new Error("Payment not found!");
    }

    if (!existingPayment.location.stripeAccountId) {
      throw new Error("Location must have stripe account id");
    }

    await stripeService.transfer(
      existingPayment.location.stripeAccountId,
      existingPayment.totalPrice ?? 0
    );

    const existingLocationReservation = await LocationReservation.findOne({
      where: {
        id: existingPayment.locationReservationId,
      },
    });

    if (!existingLocationReservation) {
      throw new Error("Location Reservation not found!");
    }

    existingPayment.status = PAYMENT_STATUS.Paid;

    await existingPayment.save();

    existingLocationReservation.totalReceivedPrice =
      (existingLocationReservation.totalReceivedPrice ?? 0) +
      (existingPayment.totalPrice ?? 0);

    await existingLocationReservation.save();
    const existingLocation = await Location.findOne({
      where: {
        id: existingLocationReservation.locationId,
      },
    });

    if (!existingLocation) {
      throw new Error("Location not found");
    }

    existingLocation.totalRevenue =
      (existingLocation.totalRevenue ?? 0) + (existingPayment.totalPrice ?? 0);

    await existingLocation.save();

    const admins = await User.find({
      where: {
        locationId: existingLocation?.id,
        role: USER_ROLE.Admin,
      },
    });

    await Promise.all(
      admins?.map(async (admin) => {
        createAndPushNotification(
          {
            content: `Payment for ${existingPayment.room.name} for ${dayjs(
              existingPayment.locationReservation.startDate
            ).format(
              "MMMM-YYYY"
            )} is settled by customer! Please review your location reservation board!`,
            locationId: existingLocationReservation.locationId,
            dataId: existingPayment?.id,
            title: "New Payment",
            userId: admin?.id,
            type: NOTIFICATION_TYPE.Payment,
          },
          [admin]
        );
      })
    );
  } catch (error) {
    throw new Error(error);
  }
}
