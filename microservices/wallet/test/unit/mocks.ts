import { IWalletRepository } from '../../src/modules/wallet/domain/repositories/IWalletRepository';
import { IUsersService } from '../../src/modules/users/ports/users.service.interface';
import {
  Transaction,
  TransactionType,
} from '../../src/modules/wallet/domain/entities/Transaction';
import { Right } from '../../src/shared/either/Either';

export const mockWalletRepository: jest.Mocked<IWalletRepository> = {
  save: jest.fn(),
  getBalanceByUserId: jest.fn(),
  findTransactionsByUserId: jest.fn(),
};

export const mockUsersService: jest.Mocked<IUsersService> = {
  checkUserExists: jest.fn().mockResolvedValue(Right(true)),
};

export const TEST_USER_ID = 'b33a8c54-7123-456b-a2c3-4318c47b59e0';
export const TEST_AMOUNT = 10000;

export const mockTransaction = Transaction.create({
  userId: TEST_USER_ID,
  amount: TEST_AMOUNT,
  type: TransactionType.CREDIT,
});

export const transaction =
  mockTransaction instanceof Transaction ? mockTransaction : null;
