import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const secret =
      configService.get<string>('JWT_ACCESS_SECRET') ||
      'cosrent_jwt_access_secret_min_32_characters_default';

    if (
      process.env.NODE_ENV === 'production' &&
      secret === 'cosrent_jwt_access_secret_min_32_characters_default'
    ) {
      throw new Error(
        'Cảnh báo bảo mật: JWT_ACCESS_SECRET phải được thiết lập khóa bí mật an toàn trong môi trường Production!',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại hoặc đã bị khóa.');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };
  }
}

