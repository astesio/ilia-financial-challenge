/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateTransactionUseCase,
  CreateTransactionCommand,
  InsufficientBalanceError,
  InvalidAmountError,
  UserNotFoundError,
} from '../../../src/modules/wallet/application/use-cases/create-transaction.use-case';
import { IWalletRepository } from '../../../src/modules/wallet/domain/repositories/IWalletRepository';
import { IUsersService } from '../../../src/modules/users/ports/users.service.interface';
import { TransactionType } from '../../../src/modules/wallet/domain/entities/Transaction';
import {
  mockWalletRepository,
  mockUsersService,
  TEST_USER_ID,
  TEST_AMOUNT,
} from '../mocks';
import { isLeft, Right, Left } from '../../../src/shared/either/Either';
import { UserIntegrationError } from '../../../src/modules/users/ports/users.service.interface';

const WALLET_REPO_TOKEN = IWalletRepository;
const USERS_SERVICE_TOKEN = IUsersService;

describe('CreateTransactionUseCase (Application Layer - Wallet)', () => {
  let useCase: CreateTransactionUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTransactionUseCase,
        { provide: WALLET_REPO_TOKEN, useValue: mockWalletRepository },
        { provide: USERS_SERVICE_TOKEN, useValue: mockUsersService },
      ],
    }).compile();

    useCase = module.get<CreateTransactionUseCase>(CreateTransactionUseCase);
    jest.clearAllMocks();

    mockUsersService.checkUserExists.mockResolvedValue(Right(true));
  });

  it('should process the credit (deposit) successfully', async () => {
    const command: CreateTransactionCommand = {
      userId: TEST_USER_ID,
      amount: TEST_AMOUNT,
      type: TransactionType.CREDIT,
    };

    const result = await useCase.execute(command);

    expect(isLeft(result)).toBe(false);
    expect(mockWalletRepository.save).toHaveBeenCalledTimes(1);
    expect(mockWalletRepository.getBalanceByUserId).not.toHaveBeenCalled();
    expect(mockUsersService.checkUserExists).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it('should be processed debit successfully if there are sufficient funds.', async () => {
    const command: CreateTransactionCommand = {
      userId: TEST_USER_ID,
      amount: 500,
      type: TransactionType.DEBIT,
    };

    mockWalletRepository.getBalanceByUserId.mockResolvedValue({ amount: 1000 });

    const result = await useCase.execute(command);

    expect(isLeft(result)).toBe(false);
    expect(mockWalletRepository.getBalanceByUserId).toHaveBeenCalledWith(
      TEST_USER_ID,
    );
    expect(mockWalletRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should return Left(InsufficientBalanceError) if the balance is insufficient for debit.', async () => {
    const command: CreateTransactionCommand = {
      userId: TEST_USER_ID,
      amount: 1000,
      type: TransactionType.DEBIT,
    };

    mockWalletRepository.getBalanceByUserId.mockResolvedValue({ amount: 500 });

    const result = await useCase.execute(command);

    expect(isLeft(result)).toBe(true);
    expect(result.left).toBeInstanceOf(InsufficientBalanceError);
    expect(mockWalletRepository.save).not.toHaveBeenCalled();
  });

  it('should return `Left(InvalidAmountError)` if the transaction value is zero or negative.', async () => {
    const command: CreateTransactionCommand = {
      userId: TEST_USER_ID,
      amount: -10,
      type: TransactionType.CREDIT,
    };

    const result = await useCase.execute(command);

    expect(isLeft(result)).toBe(true);
    expect(result.left).toBeInstanceOf(InvalidAmountError);
    expect(mockWalletRepository.save).not.toHaveBeenCalled();
  });

  it('should return Left(UserNotFoundError) if the gRPC check fails.', async () => {
    const command: CreateTransactionCommand = {
      userId: 'unknown-id',
      amount: 100,
      type: TransactionType.CREDIT,
    };

    mockUsersService.checkUserExists.mockResolvedValue(
      Left(new UserIntegrationError('gRPC failed')),
    );

    const result = await useCase.execute(command);

    expect(isLeft(result)).toBe(true);
    expect(result.left).toBeInstanceOf(UserNotFoundError);
    expect(mockWalletRepository.save).not.toHaveBeenCalled();
  });
});
