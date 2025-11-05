import { User } from '../../src/modules/users/domain/entities/User';
import { IAuthService } from '../../src/modules/users/domain/services/IAuthService';
import { IUserRepository } from '../../src/modules/users/domain/repository/IUserRepository';

export const mockUserRepository: jest.Mocked<IUserRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  exists: jest.fn(),
};

export const mockAuthService: jest.Mocked<IAuthService> = {
  generateToken: jest.fn(),
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
};

export const mockUser = User.create({
  id: '0194c075-de50-4413-9a02-10ab0cf64119',
  firstName: 'João',
  lastName: 'Test',
  email: 'joao.test@example.com',
  passwordHash: 'hashed_password_123',
});

export const mockAuthToken = { accessToken: 'mock_jwt_token' };
