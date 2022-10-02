import { JwtPayload, Secret, verify } from "jsonwebtoken";
import { AuthenticationError } from "apollo-server-express";
import { User } from "../entities/User";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import argon2 from "argon2";
import {
  UserResponse,
  ChangePasswordInput,
  UpdateMeInput,
  ListUserResponse,
  GetUsersInput,
  CreateUserInput,
  ChangeUserStatusInput,
  UpdateUserInput,
  ResetPasswordConfirmInput,
  ResetPasswordResponse,
} from "../types/user";
import {
  RegisterLoginInput,
  GetAccessTokenInput,
  LoginResponse,
} from "../types/authentication";
import { validateRegisterInput } from "../utils/user/validateRegisterInput";
import { Context } from "../types/Context";
import {
  InvalidInputError,
  InternalServerError,
  UserNotFoundError,
  PermissionDeniedError,
  OutOfBoundsError,
} from "../types/Errors";
import { createResetPasswordToken, createToken } from "../utils/user/token";
import { authMiddleware } from "../middlewares/auth-middleware";
import { ROOM_STATUS, USER_ROLE } from "../constants";
import { ILike } from "typeorm";
import { sendEmail } from "../utils/user/mailer";
import { Room } from "../entities";

@Resolver()
export class UserResolver {
  // SECTION: REGISTRATION
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
  async login(
    @Arg("input") { email, password }: RegisterLoginInput
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
        process.env.REFRESH_TOKEN_SECRET as Secret
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
        process.env.RESET_PASSWORD_TOKEN_SECRET as Secret
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

  // SECTION: MY PROFILE
  @Query((_return) => UserResponse)
  @UseMiddleware(authMiddleware)
  async me(@Ctx() { user }: Context): Promise<UserResponse | null> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      const existingUser = await User.findOne({
        where: { id: user?.id },
        relations: ["location", "room"],
      });

      if (!existingUser) throw new Error(UserNotFoundError);

      return {
        message: "Get profile successfully",
        user: existingUser,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_return) => UserResponse)
  @UseMiddleware(authMiddleware)
  async updateMe(
    @Arg("input")
    updateMeInput: UpdateMeInput,
    @Ctx() { user }: Context
  ): Promise<UserResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      const existingUser = await User.findOne({
        where: { id: user?.id },
        relations: ["location"],
      });
      if (!existingUser) throw new Error(UserNotFoundError);

      User.merge(existingUser, { ...updateMeInput });

      return {
        message: "Update profile successfully",
        user: await existingUser.save(),
      };
    } catch (err) {
      throw new Error(err);
    }
  }

  @Mutation((_return) => String)
  @UseMiddleware(authMiddleware)
  async changePassword(
    @Arg("input") { password, oldPassword }: ChangePasswordInput,
    @Ctx() { user }: Context
  ): Promise<String> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      const existingUser = await User.findOne({ where: { id: user?.id } });

      if (existingUser) {
        const passwordValid = await argon2.verify(
          existingUser.password,
          oldPassword
        );
        if (!passwordValid) throw new Error("Wrong password");

        existingUser.password = await argon2.hash(password);
        await existingUser.save();

        return "Change password successfully";
      }
      throw new Error(UserNotFoundError);
    } catch (err) {
      throw new Error(err);
    }
  }

  //SECTION: MANAGE USERS
  @Query((_return) => UserResponse)
  @UseMiddleware(authMiddleware)
  async getUser(
    @Arg("id") id: number,
    @Ctx() { user: currentUser }: Context
  ): Promise<UserResponse | null> {
    try {
      if (!currentUser?.id) throw new Error(InternalServerError);

      if (currentUser.role === USER_ROLE.Customer)
        throw new Error(PermissionDeniedError);

      const existingUser = await User.findOne({
        relations: ["location", "room"],
        where: { id },
      });

      if (!existingUser) throw new Error(UserNotFoundError);

      return {
        message: "Get user successfully",
        user: existingUser,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query((_return) => ListUserResponse)
  @UseMiddleware(authMiddleware)
  async getUsers(
    @Arg("input")
    {
      page,
      limit,
      email,
      name,
      isActive,
      locationId,
      role,
      orderBy,
      roomId,
    }: GetUsersInput,
    @Ctx() { user: currentUser }: Context
  ): Promise<ListUserResponse | null> {
    try {
      if (!currentUser?.id) throw new Error(InternalServerError);

      if (currentUser.role === USER_ROLE.Customer)
        throw new Error(PermissionDeniedError);

      let options = {
        ...(email && {
          email: ILike("%" + email + "%"),
        }),
        ...(name && { name: ILike("%" + name + "%") }),
        ...(role && { role }),
        ...(isActive !== undefined && isActive !== null && { isActive }),
        ...(locationId && { locationId }),
        ...(roomId && { roomId }),
      };

      const [result, total] = await User.findAndCount({
        where: options,
        order: { createdAt: orderBy },
        take: limit,
        skip: (page - 1) * limit,
        relations: ["location", "room"],
      });

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get users successfully",
        items: result,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation((_return) => UserResponse)
  @UseMiddleware(authMiddleware)
  async createUser(
    @Arg("input")
    createUserInput: CreateUserInput,
    @Ctx() { user: currentUser }: Context
  ): Promise<UserResponse | null> {
    try {
      const { email, password, locationId, roomId, ...rest } = createUserInput;

      if (!currentUser?.id) throw new Error(InternalServerError);

      if (currentUser.role === USER_ROLE.Customer)
        throw new Error(PermissionDeniedError);

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) throw new Error("The email is already in use");

      const hashedPassword = await argon2.hash(password);
      const newUser = User.create({
        email,
        password: hashedPassword,
        ...rest,
      });

      if (currentUser.role === USER_ROLE.SuperAdmin) {
        newUser.locationId = locationId;
        newUser.role = USER_ROLE.Admin;
      } else if (currentUser.role === USER_ROLE.Admin) {
        newUser.role = USER_ROLE.Customer;
        newUser.locationId = currentUser.locationId;
      }
      if (roomId) {
        const room = await Room.findOne({ where: { id: roomId } });
        if (!room) throw new Error("Room not found");
        newUser.roomId = roomId;
        room.status = ROOM_STATUS.Owned;
        await room.save();
      }

      return {
        message: "Create User Successfully",
        user: await newUser?.save(),
      };
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  }

  @Mutation((_return) => UserResponse)
  @UseMiddleware(authMiddleware)
  async updateUser(
    @Arg("input")
    updateUserInput: UpdateUserInput,
    @Ctx() { user: currentUser }: Context
  ): Promise<UserResponse | null> {
    try {
      const { id, roomId, ...rest } = updateUserInput;

      if (!currentUser?.id) throw new Error(InternalServerError);

      if (currentUser.role === USER_ROLE.Customer)
        throw new Error(PermissionDeniedError);

      const foundUser = await User.findOne({
        where: { id },
      });
      if (!foundUser) throw new Error(UserNotFoundError);
      if (
        foundUser.role === USER_ROLE.Customer &&
        currentUser.role !== USER_ROLE.Admin
      )
        throw new Error(PermissionDeniedError);

      if (
        foundUser.role === USER_ROLE.Admin &&
        currentUser.role !== USER_ROLE.SuperAdmin
      )
        throw new Error(PermissionDeniedError);

      User.merge(foundUser, { ...rest });

      if (roomId) {
        const room = await Room.findOne({ where: { id: roomId } });
        if (!room) throw new Error("Room not found");
        foundUser.roomId = roomId;
        room.status = ROOM_STATUS.Owned;
        await room.save();
      }

      return {
        message: "Update User Successfully",
        user: await foundUser?.save(),
      };
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  }

  @Mutation((_return) => String)
  @UseMiddleware(authMiddleware)
  async changeUserStatus(
    @Arg("input")
    { id, isActive }: ChangeUserStatusInput,
    @Ctx() { user }: Context
  ): Promise<String | null> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      const targetUser = await User.findOne({
        where: { id: id },
      });
      if (!targetUser) throw new Error(UserNotFoundError);
      if (
        user.role === USER_ROLE.SuperAdmin ||
        (user.role === USER_ROLE.Admin &&
          targetUser?.locationId === user.locationId)
      ) {
        targetUser.isActive = isActive;
      } else throw new Error(PermissionDeniedError);

      await targetUser?.save();
      return "Change User Status Successfully";
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  }
}
