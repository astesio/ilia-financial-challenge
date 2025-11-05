/* eslint-disable @typescript-eslint/unbound-method */
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  RegisterUser,
  RegisterUserInput,
} from '../../../src/modules/users/application/use-cases/RegisterUser';
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

describe('RegisterUser Use Case (Application Layer)', () => {
  let registerUser: RegisterUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUser,
        {
          provide: USER_REPO_TOKEN,
          useValue: mockUserRepository,
        },
        {
          provide: AUTH_SERVICE_TOKEN,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    registerUser = module.get<RegisterUser>(RegisterUser);
    jest.clearAllMocks();
  });

  it('should register a new user, save the password hash, and issue a JWT.', async () => {
    const input: RegisterUserInput = {
      firstName: 'New',
      lastName: 'User',
      email: 'new@email.com',
      password: 'password123',
    };

    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockAuthService.hashPassword.mockResolvedValue('new_hashed_password');
    mockAuthService.generateToken.mockReturnValue(mockAuthToken);

    const result = await registerUser.execute(input);

    expect(result.user.email).toBe(input.email);
    expect(result.token).toEqual(mockAuthToken);

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
    expect(mockAuthService.hashPassword).toHaveBeenCalledWith(input.password);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    expect(mockAuthService.generateToken).toHaveBeenCalledTimes(1);
  });

  it('should throw a ConflictException if the email is already in use.', async () => {
    const input: RegisterUserInput = {
      firstName: 'Existing',
      lastName: 'User',
      email: mockUser.email,
      password: 'password123',
    };

    mockUserRepository.findByEmail.mockResolvedValue(mockUser);

    await expect(registerUser.execute(input)).rejects.toThrow(
      ConflictException,
    );

    expect(mockAuthService.hashPassword).not.toHaveBeenCalled();
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });
});
