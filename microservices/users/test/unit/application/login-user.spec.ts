/* eslint-disable @typescript-eslint/unbound-method */
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  LoginUser,
  LoginUserInput,
} from '../../../src/modules/users/application/use-cases/LoginUser';
import { IAuthService } from '../../../src/modules/users/domain/services/IAuthService';
import { IUserRepository } from '../../../src/modules/users/domain/repository/IUserRepository';
import {
  mockAuthService,
  mockUserRepository,
  mockUser,
  mockAuthToken,
} from '../mocks';

const USER_REPO_TOKEN = IUserRepository;
const AUTH_SERVICE_TOKEN = IAuthService;

describe('LoginUser Use Case (Application Layer)', () => {
  let loginUser: LoginUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUser,
        { provide: USER_REPO_TOKEN, useValue: mockUserRepository },
        { provide: AUTH_SERVICE_TOKEN, useValue: mockAuthService },
      ],
    }).compile();

    loginUser = module.get<LoginUser>(LoginUser);
    jest.clearAllMocks();
  });

  it('should return the user and a token if the credentials are valid.', async () => {
    const input: LoginUserInput = {
      email: mockUser.email,
      password: 'valid_password',
    };

    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    mockAuthService.comparePassword.mockResolvedValue(true);
    mockAuthService.generateToken.mockReturnValue(mockAuthToken);

    const result = await loginUser.execute(input);

    expect(result.user.email).toBe(input.email);
    expect(result.token).toEqual(mockAuthToken);

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
    expect(mockAuthService.comparePassword).toHaveBeenCalledWith(
      'valid_password',
      mockUser.passwordHash,
    );
    expect(mockAuthService.generateToken).toHaveBeenCalledTimes(1);
  });

  it('should throw an UnauthorizedException if the user is not found.', async () => {
    const input: LoginUserInput = {
      email: 'nonexistent@email.com',
      password: 'any_password',
    };

    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(loginUser.execute(input)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(mockAuthService.comparePassword).not.toHaveBeenCalled();
    expect(mockAuthService.generateToken).not.toHaveBeenCalled();
  });

  it('should throw an UnauthorizedException if the password is incorrect.', async () => {
    const input: LoginUserInput = {
      email: mockUser.email,
      password: 'wrong_password',
    };

    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    mockAuthService.comparePassword.mockResolvedValue(false);

    await expect(loginUser.execute(input)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(mockAuthService.generateToken).not.toHaveBeenCalled();
  });
});
