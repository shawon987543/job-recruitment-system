import { Test, TestingModule } from '@nestjs/testing';
import { CompanyAdminController } from './company-admin.controller';

describe('CompanyAdminController', () => {
  let controller: CompanyAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyAdminController],
    }).compile();

    controller = module.get<CompanyAdminController>(CompanyAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
