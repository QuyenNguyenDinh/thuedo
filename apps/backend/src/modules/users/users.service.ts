import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng.');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    if (!dto.fullName || typeof dto.fullName !== 'string' || !dto.fullName.trim()) {
      throw new BadRequestException('Họ và tên không được để trống.');
    }
    if (!dto.phone || typeof dto.phone !== 'string' || !dto.phone.trim()) {
      throw new BadRequestException('Số điện thoại không được để trống.');
    }

    user.fullName = dto.fullName.trim();
    user.phone = dto.phone.trim();
    if (dto.address !== undefined) {
      user.address = dto.address ? String(dto.address).trim() : '';
    }

    const updated = await this.userRepository.save(user);

    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      phone: updated.phone,
      address: updated.address,
      role: updated.role,
      updatedAt: updated.updatedAt,
    };
  }
}

