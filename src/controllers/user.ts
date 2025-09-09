import User, { IUser } from '../models/user';
import { AuthedRequest, OpenRequest, Response } from '../types';
import { checkPassword, hashPassword } from '../utils/password';
import { v4 as uuid } from 'uuid';

/**
 * Creates a new user.
 * Expects a req.body with the following fields:
 * - first_name
 * - last_name
 * - email
 * - username
 * - password
 */
export const signup = async (req: OpenRequest, res: Response) => {
  const userReq = req.body;

  if (!userReq.first_name) {
    return res.status(400).json({ error: 'First name is required' });
  }
  if (!userReq.last_name) {
    return res.status(400).json({ error: 'Last name is required' });
  }
  if (!userReq.email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (!userReq.username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  if (!userReq.password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    const hashedPassword = await hashPassword(userReq.password);
    delete userReq.password;
    userReq.password_hash = hashedPassword;

    const lastId = await User.findOne({}).sort({ id: -1 }).select('id').lean();

    const userToCreate: Omit<IUser, '_id'> = {
      id: lastId ? lastId.id + 1 : 1, // TODO: Get rid of this field
      first_name: userReq.first_name,
      last_name: userReq.last_name,
      email: userReq.email,
      username: userReq.username,
      password_hash: hashedPassword,
      token: uuid(),
      is_admin: false,
    };

    const user = await User.insertOne(userToCreate);

    console.log('Created user:', user);
    return res.status(201).json({ user });
  } catch (error: any) {
    if (error.code === 11000 || error.message.includes('duplicate key error')) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ error: `A user with that ${field} already exists.` });
    }
    return res.status(500).json({ error: error.details || 'Something went wrong. Please try again.' });
  }
};

/**
 * Signs in a user with the provided username + password, if valid.
 * Signing the user in generates a new token and returns the updated user.
 */
export const signin = async (req: OpenRequest, res: Response) => {
  const userReq = req.body;
  if (!userReq.username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  if (!userReq.password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const user = await User.findOne({ username: userReq.username }).lean();
  if (!user) {
    return res.status(401).json({ error: 'Username or password is invalid.' });
  }

  const isValidPassword = await checkPassword(user, userReq.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Username or password is invalid.' });
  }

  const newToken = uuid();
  const userToReturn = await User.findOneAndUpdate({ _id: user._id }, { token: newToken }, { new: true }).lean();

  if (!userToReturn) {
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
  return res.status(200).json({ user: userToReturn });
};

/**
 * Signs out a user by clearing their auth token.
 * Must be signed in to access this route.
 * TODO: Make FE work with token in header
 */
export const signout = async (req: AuthedRequest, res: Response) => {
  const userId = (req as any).user._id;
  await User.updateOne({ _id: userId }, { token: null });
  return res.status(200).json({ success: true });
};

/**
 * Looks up a user by the provided query params. Supported params:
 * - username
 * - token
 */
export const getUserProfile = async (req: OpenRequest, res: Response) => {
  const { username, token } = req.query;

  if (!username && !token) {
    return res.status(400).json({ error: 'A username or token query param is required.' });
  }

  let user: IUser | null = null;
  if (username) {
    user = await User.findOne({ username }).lean();
  } else if (token) {
    user = await User.findOne({ token }).lean();
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.status(200).json({
    // Intentionally omitting fields like _id, password_hash, etc.
    user: {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      username: user.username,
      token: user.token,
      is_admin: user.is_admin,
    },
  });
};

export const updateUser = async (req: AuthedRequest, res: Response) => {
  return res.status(501).send('Not implemented yet');
};

export const deleteUser = async (req: AuthedRequest, res: Response) => {
  return res.status(501).send('Not implemented yet');
};
