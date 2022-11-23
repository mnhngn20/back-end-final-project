import { PLAT_FORM } from "./../constants";
import { Request, Response } from "express";
import { Session, SessionData } from "express-session";
import { JwtPayload } from "jsonwebtoken";
import { User } from "../entities";

export type UserPayload = Partial<User> & JwtPayload;

export type Context = {
  req: Request & {
    session: Session & Partial<SessionData> & { userId?: number };
  };
  res: Response;
  user?: UserPayload;
  platform?: PLAT_FORM;
};
