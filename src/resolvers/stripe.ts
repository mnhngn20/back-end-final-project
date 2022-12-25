import { authMiddleware } from "../middlewares/auth-middleware";
import { Context } from "../types/Context";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { StripeService } from "../services/stripe.service";
import { Location, Payment, User } from "../entities";
import { PermissionDeniedError } from "../types/Errors";
import { CreateStripeCheckoutInput, StripeResponse } from "../types/stripe";

@Resolver()
export class StripeResolver {
  @UseMiddleware(authMiddleware)
  @Mutation((_returns) => String)
  async authorizeCode(@Arg("code") code: string, @Ctx() { user }: Context) {
    const stripe = new StripeService();

    try {
      const responseId = await stripe.authorizeCode(code);
      const existingUser = await User.findOne({ where: { id: user?.id } });

      if (!existingUser) {
        throw new Error("User not found!");
      }
      if (!existingUser.locationId) {
        throw new Error(PermissionDeniedError);
      }

      const existingLocation = await Location.findOne({
        where: { id: existingUser?.locationId },
      });
      if (!existingLocation) {
        throw new Error("Location not found!");
      }

      existingLocation.stripeAccountId = responseId;

      await existingLocation.save();

      return "Success fully saved stripe account to your location";
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation(() => StripeResponse)
  @UseMiddleware(authMiddleware)
  async createStripeCheckoutSession(
    @Arg("input")
    { paymentId, cancelUrl, successUrl, payerId }: CreateStripeCheckoutInput
  ): Promise<StripeResponse> {
    const stripeService = new StripeService();
    const existingPayment = await Payment.findOne({
      where: {
        id: paymentId,
      },
      relations: ["room", "location"],
    });

    if (!existingPayment) {
      throw new Error("Payment not found");
    }

    const session = await stripeService.createCheckoutSession({
      cancelUrl,
      paymentId,
      successUrl,
      description: `Payment for Room ${existingPayment.room.name}`,
      title: `Location: ${existingPayment.location.name}`,
      price: existingPayment.totalPrice,
      image: existingPayment.room.thumbnail,
      payerId,
    });

    if (!session.url) {
      throw new Error("Internal server error");
    }

    return {
      message: "Created checkout session successfully!",
      url: session.url,
    };
  }
}
