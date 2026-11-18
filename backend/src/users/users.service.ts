import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';

const SALT_ROUNDS = 10;

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: normalizeEmail(email) })
      .select('+password')
      .exec();
  }

  async create({
    email,
    name,
    password,
  }: CreateUserInput): Promise<UserDocument> {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    return this.userModel.create({
      email: normalizeEmail(email),
      name,
      password: passwordHash,
    });
  }
}
