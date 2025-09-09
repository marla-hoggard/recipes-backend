import { Request, Response as ExpressResponse } from 'express';
import { IUser } from './models/user';

// export interface AuthedRequest extends Request {
//   user: IUser;
// }
export interface AuthedRequest extends Request {}

export interface OpenRequest extends Request {}

export type Response = ExpressResponse;
