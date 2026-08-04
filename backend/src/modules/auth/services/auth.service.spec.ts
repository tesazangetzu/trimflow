import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User, UserRole } from '../entities/user.entity';
import { TrimflowLoggerService } from '../../../shared/logger';
import { UnauthorizedError } from '../../../shared/exceptions';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Admin',
    email: 'admin@trimflow.com',
    password: '$2b$10$hashedpassword',
    role: UserRole.ADMIN,
    tenantId: 'tenant-uuid',
    barberId: undefined,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as User;

  const mockLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: TrimflowLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = { email: 'admin@trimflow.com', password: 'admin123' };

    it('should return tokens when credentials are valid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      userRepository.findOne.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('signed-jwt-token');

      const result = await service.login(loginDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'admin@trimflow.com', isActive: true },
      });
      expect(result).toHaveProperty('accessToken', 'signed-jwt-token');
      expect(result).toHaveProperty('refreshToken', 'signed-jwt-token');
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockLogger.log).toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedError);
      expect(userRepository.findOne).toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when password is invalid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when user is inactive', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('validateUser', () => {
    it('should return user payload when user is found and active', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(mockUser.id);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tenantId: mockUser.tenantId,
      });
    });

    it('should return null when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent-id');

      expect(result).toBeNull();
    });
  });
});
