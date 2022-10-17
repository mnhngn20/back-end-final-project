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
} from "../types/user";
import { Context } from "../types/Context";
import {
  InternalServerError,
  UserNotFoundError,
  PermissionDeniedError,
  OutOfBoundsError,
} from "../types/Errors";
import { authMiddleware } from "../middlewares/auth-middleware";
import { ROOM_STATUS, USER_ROLE } from "../constants";
import { ILike } from "typeorm";
import { Room } from "../entities";

@Resolver()
export class UserResolver {
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

      console.log(existingUser);

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
        if (!locationId) {
          throw new Error("Must include location when create user");
        }
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
