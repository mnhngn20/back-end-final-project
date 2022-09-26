import { MiddlewareFn } from "type-graphql";
import { Context, UserPayload } from "../types/Context";
import { Secret, verify } from "jsonwebtoken";
import { AuthenticationError } from "apollo-server-express";
import { User } from "../entities";

export const authMiddleware: MiddlewareFn<Context> = async (
  { context },
  next
) => {
  try {
    const authHeader = context.req.header("Authorization");
    const accessToken = authHeader && authHeader.split(" ")[1];

    if (!accessToken) {
      throw new AuthenticationError("No token header provided!");
    }

    const decodedUser = verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET as Secret
    ) as UserPayload;

    const existingUser = await User.findOne({
      where: {
        id: decodedUser?.id,
      },
    });

    if (!existingUser) throw new Error("User Not Found");

    if (!existingUser?.isActive)
      throw new Error(
        "User is deactivated, please contact your administrator to activate your account!"
      );

    context.user = decodedUser;

    return next();
  } catch (error) {
    throw new AuthenticationError(error);
  }
};
