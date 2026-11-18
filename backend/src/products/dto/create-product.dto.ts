import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  MAX_SPECS,
  PRODUCT_UNITS,
  SKU_PATTERN,
  type ProductUnit,
} from '../schemas/product.schema.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ProductSpecDto {
  @ApiProperty({ example: 'Origen' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'Huila' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class ProductDetailsDto {
  @ApiPropertyOptional({ example: 'Finca Felipe' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 500, minimum: 0, exclusiveMinimum: true })
  @IsOptional()
  @IsPositive()
  weight?: number;

  @ApiPropertyOptional({ enum: PRODUCT_UNITS, example: 'g' })
  @IsOptional()
  @IsIn(PRODUCT_UNITS)
  unit?: ProductUnit;

  @ApiPropertyOptional({ type: [ProductSpecDto], maxItems: MAX_SPECS })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_SPECS)
  @ValidateNested({ each: true })
  @Type(() => ProductSpecDto)
  specs?: ProductSpecDto[];
}

export class CreateProductDto {
  @ApiProperty({
    example: 'CAF-001',
    pattern: SKU_PATTERN.source,
    description: 'Unique product code, stored uppercase. Cannot be modified.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(SKU_PATTERN)
  sku: string;

  @ApiProperty({ example: 'Café 500g', minLength: 3, maxLength: 100 })
  @Transform(trim)
  @IsString()
  @Length(3, 100)
  name: string;

  @ApiPropertyOptional({
    example: 'Café de origen, tostión media',
    maxLength: 1000,
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 25000, minimum: 0, description: 'Price in COP' })
  @IsInt()
  @Min(0)
  price: number;

  @ApiProperty({ example: 120, minimum: 0 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 'Café', minLength: 2, maxLength: 50 })
  @Transform(trim)
  @IsString()
  @Length(2, 50)
  category: string;

  @ApiPropertyOptional({ type: ProductDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductDetailsDto)
  details?: ProductDetailsDto;
}
