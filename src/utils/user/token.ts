import { User } from "./../../entities/User";
import { Secret, sign } from "jsonwebtoken";

export const createToken = (
  user: User,
  isAccessToken: boolean = true,
  expiresIn: number | string = "1h"
) =>
  sign(
    {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      role: user.role,
      locationId: user.locationId,
    },
    isAccessToken
      ? (process.env.ACCESS_TOKEN_SECRET as Secret)
      : (process.env.REFRESH_TOKEN_SECRET as Secret),
    {
      expiresIn: expiresIn,
    }
  );

export const createResetPasswordToken = (user: User) =>
  sign(
    {
      id: user?.id,
      email: user?.email,
    },
    process.env.RESET_PASSWORD_TOKEN_SECRET as Secret,
    {
      expiresIn: "15m",
    }
  );
