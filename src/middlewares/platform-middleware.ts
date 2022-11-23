import { PLAT_FORM } from "./../constants";
import { MiddlewareFn } from "type-graphql";
import { Context } from "../types/Context";
import { AuthenticationError } from "apollo-server-express";
import { PLATFORM, USER_ROLE } from "../constants";

export const platformMiddleware: MiddlewareFn<Context> = async (
  { context },
  next
) => {
  try {
    const platform = context.req.header("platform");

    if (!platform || !PLATFORM.includes(platform as USER_ROLE)) {
      throw new AuthenticationError(
        `Platform must be in ["SuperAdmin", "Admin", "Customer"]`
      );
    }

    context.platform = platform as PLAT_FORM;

    return next();
  } catch (error) {
    throw new AuthenticationError(error);
  }
};
