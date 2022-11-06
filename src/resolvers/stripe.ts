import { authMiddleware } from "../middlewares/auth-middleware";
import { Context } from "../types/Context";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { StripeService } from "../services/stripe.service";
import { Location, User } from "../entities";
import { PermissionDeniedError } from "../types/Errors";

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
}
