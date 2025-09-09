import bcrypt from 'bcrypt';
import { IUser } from '../models/user';

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

export const checkPassword = async (user: IUser, password: string) => {
  return await bcrypt.compare(password, user.password_hash);
};
