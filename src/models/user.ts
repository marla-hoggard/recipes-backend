import { model, Types, Schema } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  id: number; // TODO: Decide what to do about this
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password_hash: string;
  token: string;
  is_admin: boolean;
}

const UserSchema = new Schema<IUser>({
  id: { type: Number, required: true, unique: true }, // TODO: Decide what to do about this
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  token: { type: String, required: true },
  is_admin: { type: Boolean, required: true, default: false },
});

export default model<IUser>('User', UserSchema);
