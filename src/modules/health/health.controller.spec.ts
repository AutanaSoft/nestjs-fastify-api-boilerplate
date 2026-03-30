import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { HealthCheckResult } from '@nestjs/terminus';

jest.mock('../database/services/prisma.service', () => ({
  PrismaService: class MockPrismaService {},
}));

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  const mockHealthResult: HealthCheckResult = {
    status: 'ok',
    info: { 'nestjs-docs': { status: 'up' } },
    error: {},
    details: { 'nestjs-docs': { status: 'up' } },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            check: jest.fn().mockResolvedValue(mockHealthResult),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health check result', async () => {
      const result = await controller.check();
      expect(result).toEqual(mockHealthResult);

      expect(service.check).toHaveBeenCalled();
    });
  });

  describe('ping', () => {
    it('should return "pong"', () => {
      expect(controller.ping()).toBe('pong');
    });
  });
});
