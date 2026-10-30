import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CostumeVariant } from '../../entities/costume-variant.entity';
import { DateUtil } from '../../common/utils/date.util';
import { QuoteItemDto } from './dto/quote-request.dto';

export interface CalculatedQuoteItem {
  costumeVariantId: string;
  costumeId: string;
  costumeName: string;
  size: string;
  dailyPrice: number;
  depositAmount: number;
  quantity: number;
  lineRentalFee: number;
  lineDeposit: number;
}

export interface CalculatedQuote {
  startDate: string;
  endDate: string;
  rentalDays: number;
  items: CalculatedQuoteItem[];
  totalRentalFee: number;
  totalDeposit: number;
  totalDueAtStore: number;
}

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(CostumeVariant)
    private variantRepository: Repository<CostumeVariant>,
  ) {}

  async calculateQuote(
    startDate: string,
    endDate: string,
    items: QuoteItemDto[],
  ): Promise<CalculatedQuote> {
    if (!items || items.length === 0) {
      throw new BadRequestException('Danh sách mặt hàng thuê không được rỗng.');
    }

    let rentalDays: number;
    try {
      DateUtil.parseDateString(startDate);
      DateUtil.parseDateString(endDate);
      if (DateUtil.isDateInPast(startDate)) {
        throw new BadRequestException('Ngày nhận đồ không được ở trong quá khứ.');
      }
      rentalDays = DateUtil.calculateRentalDays(startDate, endDate);
      if (rentalDays > DateUtil.MAX_RENTAL_DAYS) {
        throw new BadRequestException(
          `Thời gian thuê tối đa là ${DateUtil.MAX_RENTAL_DAYS} ngày cho mỗi đơn.`,
        );
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(err.message || 'Khoảng ngày thuê không hợp lệ.');
    }

    let totalRentalFee = 0;
    let totalDeposit = 0;
    const calculatedItems: CalculatedQuoteItem[] = [];

    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        throw new BadRequestException('Số lượng thuê của mỗi mặt hàng phải lớn hơn 0.');
      }

      const variant = await this.variantRepository.findOne({
        where: { id: item.costumeVariantId },
        relations: ['costume'],
      });

      if (!variant) {
        throw new NotFoundException(`Không tìm thấy biến thể kích cỡ ID: ${item.costumeVariantId}`);
      }

      if (!variant.costume || !variant.costume.isActive) {
        throw new BadRequestException(`Trang phục "${variant.costume?.name || ''}" hiện đang ngừng cho thuê.`);
      }

      const dailyPrice = variant.costume.dailyPrice;
      const depositAmount = variant.costume.depositAmount;
      const qty = item.quantity;

      const lineRentalFee = dailyPrice * rentalDays * qty;
      const lineDeposit = depositAmount * qty;

      totalRentalFee += lineRentalFee;
      totalDeposit += lineDeposit;

      calculatedItems.push({
        costumeVariantId: variant.id,
        costumeId: variant.costume.id,
        costumeName: variant.costume.name,
        size: variant.size,
        dailyPrice,
        depositAmount,
        quantity: qty,
        lineRentalFee,
        lineDeposit,
      });
    }

    return {
      startDate,
      endDate,
      rentalDays,
      items: calculatedItems,
      totalRentalFee,
      totalDeposit,
      totalDueAtStore: totalRentalFee + totalDeposit,
    };
  }
}

