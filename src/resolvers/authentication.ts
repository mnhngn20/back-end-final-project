import { platformMiddleware } from "./../middlewares/platform-middleware";
import argon2, { verify } from "argon2";
import {
  ResetPasswordConfirmInput,
  ResetPasswordResponse,
  UserResponse,
} from "../types/user";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import {
  GetAccessTokenInput,
  LoginResponse,
  RegisterLoginInput,
} from "../types/authentication";
import { validateRegisterInput } from "../utils/user/validateRegisterInput";
import { InvalidInputError, PermissionDeniedError } from "../types/Errors";
import { User } from "../entities";
import { createResetPasswordToken, createToken } from "../utils/user/token";
import { JwtPayload } from "jsonwebtoken";
import { AuthenticationError } from "apollo-server-core";
import { sendEmail } from "../utils/user/mailer";
import { Context } from "../types/Context";

@Resolver()
export class AuthResolver {
  @Mutation((_return) => UserResponse)
  async register(
    @Arg("input") registerInput: RegisterLoginInput
  ): Promise<UserResponse> {
    if (validateRegisterInput(registerInput)) {
      throw new Error(InvalidInputError);
    }

    try {
      const { email, password } = registerInput;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) throw new Error("The email is already in use");

      const hashedPassword = await argon2.hash(password);

      const newUser = User.create({
        ...registerInput,
        email,
        password: hashedPassword,
      });

      return {
        message: "User registration successful",
        user: await User.save(newUser),
      };
    } catch (err) {
      throw new Error(err);
    }
  }

  @Mutation((_return) => LoginResponse)
  @UseMiddleware(platformMiddleware)
  async login(
    @Arg("input") { email, password }: RegisterLoginInput,
    @Ctx() { req }: Context
  ): Promise<LoginResponse> {
    try {
      const existingUser = await User.findOne({ where: { email } });

      if (!existingUser) throw new Error("Email doesn't exist");
      if (!existingUser.isActive) throw new Error("Current user is disabled.");
      const isPasswordValid = await argon2.verify(
        existingUser.password,
        password
      );
      if (!isPasswordValid) throw new Error("Wrong password");

      if (req.header("platform") !== existingUser?.role) {
        throw new Error(PermissionDeniedError);
      }

      return {
        message: "Logged in successfully",
        user: existingUser,
        accessToken: createToken(existingUser),
        refreshToken: createToken(existingUser, false, "100d"),
      };
    } catch (err) {
      throw new Error(err);
    }
  }

  @Mutation((_return) => LoginResponse)
  async getAccessToken(
    @Arg("input") { refreshToken }: GetAccessTokenInput
  ): Promise<LoginResponse> {
    try {
      const decodedUser = verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET as string
      ) as JwtPayload & Partial<User>;

      const existingUser = await User.findOne({
        where: { id: decodedUser?.id },
      });
      if (!existingUser) throw new Error("User not found");

      return {
        message: "Get access token successfully",
        user: existingUser,
        accessToken: createToken(existingUser),
        refreshToken: createToken(existingUser, false, "100d"),
      };
    } catch (error) {
      throw new AuthenticationError(error);
    }
  }

  @Mutation((_return) => ResetPasswordResponse)
  async resetPassword(
    @Arg("email") email: string
  ): Promise<ResetPasswordResponse> {
    try {
      const existingUser = await User.findOne({ where: { email } });
      if (!existingUser) throw new Error("User Not Found");

      const resetPasswordToken = createResetPasswordToken(existingUser);

      const resetPasswordURL = `${process.env.APPLICATION_URL}/reset-password?token=${resetPasswordToken}`;

      await sendEmail(
        email,
        "No Reply: CSpace Reset Password Mail",
        `Hello ${email}, here is the link to reset your password: ${resetPasswordURL}, this link will expire in the next 15 minutes, thanks for using our service!`
      );

      return {
        message: "Reset Password Email sent!",
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_return) => ResetPasswordResponse)
  async resetPasswordConfirm(
    @Arg("input") { password, token }: ResetPasswordConfirmInput
  ): Promise<ResetPasswordResponse> {
    try {
      const decodedUser = verify(
        token,
        process.env.RESET_PASSWORD_TOKEN_SECRET as string
      ) as Partial<User>;

      if (!decodedUser?.id) throw new Error("Internal Server Error");
      const existingUser = await User.findOne({
        where: { id: Number(decodedUser.id) },
      });
      if (!existingUser) throw new Error("User Not Found");
      const hashedPassword = await argon2.hash(password);
      existingUser.password = hashedPassword;

      await existingUser.save();

      return {
        message: "Reset Password successfully",
      };
    } catch (error) {
      throw new Error(error);
    }
  }
}
