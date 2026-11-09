import { Test, TestingModule } from '@nestjs/testing';
import { CompanyAdminService } from './company-admin.service';

describe('CompanyAdminService', () => {
  let service: CompanyAdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyAdminService],
    }).compile();

    service = module.get<CompanyAdminService>(CompanyAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
