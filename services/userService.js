const UserModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('./mailService');
const tokenService = require('./tokenService');
const UserDto = require('../dtos/userDto');
const ApiError = require('../exceptions/apiError');
const { default: mongoose } = require('mongoose');

class UserService {
  async registration(email, password) {
    const candidate = await UserModel.findOne({ email });
    if (candidate) {
      throw ApiError.BadRequest(
        `A user with email ${email} has been already registrated`
      );
    }

    const hashPassword = await bcrypt.hash(password, 3);
    const activationLink = uuid.v4();
    const user = await UserModel.create({
      email,
      password: hashPassword,
      activationLink,
    });
    // await mailService.sendActivationMail(
    //   email,
    //   `${process.env.API_URL}/api/activate/${activationLink}`
    // );

    const userDto = new UserDto(user); // id, email, isActivated
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return {
      ...tokens,
      user: userDto,
    };
  }

  async activate(activationLink) {
    const user = await UserModel.findOne({ activationLink });

    if (!user) {
      throw ApiError.BadRequest('Wrong activation link!');
    }
    user.isActivated = true;
    await user.save();
  }

  async login(email, password) {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw ApiError.BadRequest('User with this email has not been found');
    }

    const isPassEquals = await bcrypt.compare(password, user.password);
    if (!isPassEquals) {
      throw ApiError.BadRequest('Wrong password');
    }

    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);
    return {
      ...tokens,
      user: userDto,
    };
  }

  async logout(refreshToken) {
    const token = await tokenService.removeToken(refreshToken);
    return token;
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }

    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken);

    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError();
    }

    const user = await UserModel.findById(userData.id);
    const userDto = new UserDto(user);

    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);
    return {
      ...tokens,
      user: userDto,
    };
  }

  async getAllUsers() {
    const users = await UserModel.find();
    return users;
  }

  async makeTransfer(senderEmail, recieverEmail, amount) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const sender = await UserModel.findOne({ email: senderEmail });
      const reciever = await UserModel.findOne({ email: recieverEmail });

      if (!reciever) {
        throw new Error('There is no user with such an email');
      }

      if (sender.balance < amount) {
        throw new Error('Sender account does not have enough funds');
      }

      await UserModel.updateOne(
        { email: senderEmail },
        {
          $inc: { balance: -amount },
          $push: { movements: { amount: -amount, date: new Date() } },
        }
      );

      await UserModel.updateOne(
        { email: recieverEmail },
        {
          $inc: { balance: amount },
          $push: { movements: { amount, date: new Date() } },
        }
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  }
}

module.exports = new UserService();
