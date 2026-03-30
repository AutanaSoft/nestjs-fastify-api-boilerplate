import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import databaseConfig from '@/config/database.config';

// Mock de la dependencia PrismaPg
jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

// Mock balanceado de PrismaClient para permitir herencia sin errores de constructor
jest.mock('../prisma/generated/client', () => {
  return {
    PrismaClient: class {
      constructor() {} // Constructor vacio para evitar validaciones de Driver Adapter
      $connect = jest.fn();
      $disconnect = jest.fn();
      $on = jest.fn();
      $transaction = jest.fn();
    },
  };
});

import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let logger: jest.Mocked<PinoLogger>;

  const mockConfig = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  };

  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: databaseConfig.KEY,
          useValue: mockConfig,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    logger = module.get(PinoLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(logger.setContext).toHaveBeenCalledWith('PrismaService');
  });

  describe('onModuleInit', () => {
    it('should connect to database successfully', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Database connection established'),
      );
    });

    it('should log error and throw if connection fails', async () => {
      const error = new Error('Connection failed');
      const connectSpy = jest.spyOn(service, '$connect').mockRejectedValue(error);

      await expect(service.onModuleInit()).rejects.toThrow(error);
      expect(connectSpy).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to connect to database'),
        { error: 'Connection failed' },
      );
    });

    it('should log unknown error message if non-Error object is thrown', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockRejectedValue('Something bad');

      await expect(service.onModuleInit()).rejects.toBe('Something bad');
      expect(connectSpy).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to connect to database'),
        { error: 'Unknown error' },
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from database successfully', async () => {
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Database connection closed'),
      );
    });

    it('should log error if disconnection fails', async () => {
      const error = new Error('Disconnect failed');
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockRejectedValue(error);

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error closing database connection'),
        { error: 'Disconnect failed' },
      );
    });
  });

  describe('enableShutdownHooks', () => {
    it('should register beforeExit hook', () => {
      const mockApp = { close: jest.fn() } as unknown as INestApplication;
      const onSpy = jest.spyOn(service, '$on');

      service.enableShutdownHooks(mockApp);

      expect(onSpy).toHaveBeenCalledWith('beforeExit', expect.any(Function));

      // Simular ejecucion del callback
      const callback = onSpy.mock.calls[0][1] as () => void;
      callback();
      expect(mockApp.close).toHaveBeenCalled();
    });
  });

  describe('executeTransaction', () => {
    it('should delegate transaction to $transaction', async () => {
      const mockResult = { id: 1 };
      const transactionFn = jest.fn().mockResolvedValue(mockResult);
      const transactionSpy = jest.spyOn(service, '$transaction').mockResolvedValue(mockResult);

      const result = await service.executeTransaction(transactionFn);

      expect(result).toBe(mockResult);
      expect(transactionSpy).toHaveBeenCalledWith(transactionFn);
    });
  });
});
