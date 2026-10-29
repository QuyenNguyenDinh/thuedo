import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../../entities/user.entity';
import { RefreshSession } from '../../entities/refresh-session.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshSession)
    private sessionRepository: Repository<RefreshSession>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto): Promise<{ id: string; email: string; fullName: string; role: Role }> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('Email này đã được đăng ký tài khoản.');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    const user = this.userRepository.create({
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      fullName: dto.fullName.trim(),
      phone: dto.phone.trim(),
      address: dto.address?.trim() || null,
      role: Role.CUSTOMER,
    });

    const saved = await this.userRepository.save(user);

    return {
      id: saved.id,
      email: saved.email,
      fullName: saved.fullName,
      role: saved.role,
    };
  }

  async login(
    dto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      fullName: string;
      role: Role;
      phone?: string;
      address?: string | null;
    };
  }> {
    const email = dto.email.toLowerCase().trim();

    // Select with passwordHash
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    // Constant-time-like or unified response
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const tokens = await this.generateTokens(user, userAgent, ipAddress);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
    };
  }

  async refreshTokens(
    oldRefreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      fullName: string;
      role: Role;
      phone?: string;
      address?: string | null;
    };
  }> {
    if (!oldRefreshToken) {
      throw new UnauthorizedException('Không tìm thấy refresh token.');
    }

    const tokenHash = this.hashToken(oldRefreshToken);
    const session = await this.sessionRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!session) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    if (session.isRevoked) {
      // Possible reuse detection: revoke all sessions of this user
      this.logger.warn(`Phát hiện tái sử dụng Refresh Token đã bị thu hồi của user ${session.userId}`);
      await this.sessionRepository.update({ userId: session.userId }, { isRevoked: true });
      throw new UnauthorizedException('Phiên làm việc đã bị thu hồi do phát hiện bất thường.');
    }

    if (new Date() > session.expiresAt) {
      session.isRevoked = true;
      await this.sessionRepository.save(session);
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn.');
    }

    // Revoke old session (Rotation)
    session.isRevoked = true;
    await this.sessionRepository.save(session);

    // Issue new pair
    const tokens = await this.generateTokens(session.user, userAgent, ipAddress);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.fullName,
        role: session.user.role,
        phone: session.user.phone,
        address: session.user.address,
      },
    };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.sessionRepository.update({ tokenHash }, { isRevoked: true });
    }
  }

  private async generateTokens(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const jwtSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'cosrent_jwt_access_secret_min_32_characters_default';

    if (
      process.env.NODE_ENV === 'production' &&
      jwtSecret === 'cosrent_jwt_access_secret_min_32_characters_default'
    ) {
      throw new Error(
        'Cảnh báo bảo mật: JWT_ACCESS_SECRET phải được thiết lập khóa bí mật an toàn trong môi trường Production!',
      );
    }

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
    });

    const refreshTokenRaw = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(refreshTokenRaw);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const session = this.sessionRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
    });
    await this.sessionRepository.save(session);

    return { accessToken, refreshToken: refreshTokenRaw };
  }
}

