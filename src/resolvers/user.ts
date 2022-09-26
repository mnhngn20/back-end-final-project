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
  ChangeUserRoleInput,
  UpdateUserInput,
  ResetPasswordConfirmInput,
  ResetPasswordResponse,
  SendNotificationInput,
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
import { USER_ROLE } from "../constants";
import { ILike } from "typeorm";
import { sendEmail } from "../utils/user/mailer";
import NotificationHelper from "../utils/common/notificationHelper";

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

  @Mutation((_return) => UserResponse)
  @UseMiddleware(authMiddleware)
  async updateFirebaseToken(
    @Arg("token") token: string,
    @Ctx() { user }: Context
  ): Promise<UserResponse | null> {
    try {
      const existingUser = await User.findOne({
        where: { id: user?.id },
      });
      if (!existingUser) throw new Error("User Not Found");

      existingUser.firebaseToken = token;

      return {
        message: "Update firebase token successfully",
        user: await existingUser.save(),
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
        relations: [
          "location",
          "reservations",
          "reservationsCreatedForCustomer",
        ],
        where: { id: user?.id },
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
    { avatar, identityNumber, dob, fullName, phoneNumber }: UpdateMeInput,
    @Ctx() { user }: Context
  ): Promise<UserResponse> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      const existingUser = await User.findOne({
        where: { id: user?.id },
        relations: [
          "location",
          "reservations",
          "reservationsCreatedForCustomer",
        ],
      });

      if (existingUser) {
        if (fullName) existingUser.fullName = fullName;
        if (avatar) existingUser.avatar = avatar;
        if (identityNumber) existingUser.identityNumber = identityNumber;
        if (phoneNumber) existingUser.phoneNumber = phoneNumber;
        if (dob) existingUser.dob = dob;

        await existingUser.save();

        return {
          message: "Update profile successfully",
          user: existingUser,
        };
      }
      throw new Error(UserNotFoundError);
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

  @Mutation((_return) => String)
  @UseMiddleware(authMiddleware)
  async deposit(
    @Arg("amount") amount: number,
    @Ctx() { user }: Context
  ): Promise<String> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      if (amount <= 0) throw new Error(InvalidInputError);

      const targetUser = await User.findOne({ where: { id: user.id } });
      if (targetUser) {
        targetUser.balance = targetUser.balance + amount;
      } else throw new Error(UserNotFoundError);
      await targetUser?.save();
      return "Deposit successfully";
    } catch (err) {
      throw new Error(err);
    }
  }

  //SECTION: MANAGE USERS
  @Query((_return) => UserResponse)
  @UseMiddleware(authMiddleware)
  async getUser(
    @Arg("id") id: number,
    @Ctx() { user }: Context
  ): Promise<UserResponse | null> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      if (user.role === USER_ROLE.Customer)
        throw new Error(PermissionDeniedError);

      const existingUser = await User.findOne({
        relations: [
          "location",
          "reservations",
          "reservationsCreatedForCustomer",
        ],
        where: { id: id },
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
      fullName,
      isActive,
      locationId,
      role,
      orderBy,
    }: GetUsersInput,
    @Ctx() { user }: Context
  ): Promise<ListUserResponse | null> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      if (user.role === USER_ROLE.Customer)
        throw new Error(PermissionDeniedError);

      let options = {
        email: ILike("%" + email + "%"),
        ...(fullName && { fullName: ILike("%" + fullName + "%") }),
        ...(role && { role }),
        ...(isActive !== undefined && isActive !== null && { isActive }),
        ...(locationId && { locationId }),
      };

      const [result, total] = await User.findAndCount({
        where: options,
        order: { createdAt: orderBy },
        take: limit,
        skip: (page - 1) * limit,
        relations: [
          "location",
          "reservations",
          "reservationsCreatedForCustomer",
        ],
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
    {
      email,
      password,
      fullName,
      avatar,
      dob,
      identityNumber,
      locationId,
      phoneNumber,
      role,
    }: CreateUserInput,
    @Ctx() { user }: Context
  ): Promise<UserResponse | null> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      if (user.role === USER_ROLE.Customer)
        throw new Error(PermissionDeniedError);

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) throw new Error("The email is already in use");

      const hashedPassword = await argon2.hash(password);
      const newUser = User.create({
        email,
        password: hashedPassword,
      });
      if (user.role === USER_ROLE.SuperAdmin) {
        if (locationId) newUser.locationId = locationId;
        if (role) newUser.role = role;
      } else if (user.role === USER_ROLE.Admin) {
        if (role === USER_ROLE.SuperAdmin)
          throw new Error(PermissionDeniedError);
        if (role) newUser.role = role;

        if (role !== USER_ROLE.Customer) {
          newUser.locationId = user.locationId;
        }
      }
      if (fullName) newUser.fullName = fullName;
      if (avatar) newUser.avatar = avatar;
      if (dob) newUser.dob = dob;
      if (identityNumber) newUser.identityNumber = identityNumber;
      if (phoneNumber) newUser.phoneNumber = phoneNumber;

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
    { id, fullName, avatar, dob, identityNumber, phoneNumber }: UpdateUserInput,
    @Ctx() { user }: Context
  ): Promise<UserResponse | null> {
    try {
      if (!user?.id) throw new Error(InternalServerError);

      if (user.role === USER_ROLE.Customer)
        throw new Error(PermissionDeniedError);

      const customer = await User.findOne({
        where: { id: id },
      });
      if (!customer) throw new Error(UserNotFoundError);
      if (
        customer.role !== USER_ROLE.Customer &&
        user.role !== USER_ROLE.SuperAdmin
      )
        throw new Error(PermissionDeniedError);

      if (fullName) customer.fullName = fullName;
      if (avatar) customer.avatar = avatar;
      if (dob) customer.dob = dob;
      if (identityNumber) customer.identityNumber = identityNumber;
      if (phoneNumber) customer.phoneNumber = phoneNumber;

      return {
        message: "Update User Successfully",
        user: await customer?.save(),
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

  @Mutation((_return) => String)
  @UseMiddleware(authMiddleware)
  async changeUserRole(
    @Arg("input")
    { id, role }: ChangeUserRoleInput,
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
          targetUser?.locationId === user.locationId &&
          (role === USER_ROLE.Admin || role === USER_ROLE.Employee))
      ) {
        targetUser.role = role;
      } else throw new Error(PermissionDeniedError);

      await targetUser?.save();
      return "Change User Status Successfully";
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  }

  @Query((_return) => String)
  @UseMiddleware(authMiddleware)
  async sendNotification(
    @Arg("input")
    { uid, title, content, data }: SendNotificationInput,
    @Ctx() { user }: Context
  ): Promise<String | null> {
    try {
      if (user?.role !== USER_ROLE.SuperAdmin)
        throw new Error(PermissionDeniedError);
      const targetUser = await User.findOne({
        where: { id: uid },
      });
      if (!targetUser) throw new Error(UserNotFoundError);
      if (!targetUser.firebaseToken)
        throw new Error("User doesn't have firebase token");

      NotificationHelper.sendToDevice(targetUser.firebaseToken, {
        notification: {
          title: title,
          body: content,
        },
        ...(data && { data: JSON.parse(data) }),
      });

      return "Send Notification Successfully";
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  }
}
