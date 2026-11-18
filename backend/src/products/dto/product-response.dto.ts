import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductDetailsDto } from './create-product.dto.js';

export class ProductResponseDto {
  @ApiProperty({ example: '665f1c2e8b3a4d0012a1b2c3' })
  id: string;

  @ApiProperty({ example: 'CAF-001' })
  sku: string;

  @ApiProperty({ example: 'Café 500g' })
  name: string;

  @ApiPropertyOptional({ example: 'Café de origen, tostión media' })
  description?: string;

  @ApiProperty({ example: 25000 })
  price: number;

  @ApiProperty({ example: 120 })
  stock: number;

  @ApiProperty({ example: 'Café' })
  category: string;

  @ApiPropertyOptional({ type: ProductDetailsDto })
  details?: ProductDetailsDto;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-11-18T15:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-11-18T15:00:00.000Z' })
  updatedAt: Date;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class PaginatedProductsResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  data: ProductResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
