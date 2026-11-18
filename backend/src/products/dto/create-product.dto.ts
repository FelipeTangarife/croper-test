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
  @IsString({ message: 'El nombre de la especificación debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre de la especificación es obligatorio' })
  key: string;

  @ApiProperty({ example: 'Huila' })
  @Transform(trim)
  @IsString({ message: 'El valor de la especificación debe ser un texto' })
  @IsNotEmpty({ message: 'El valor de la especificación es obligatorio' })
  value: string;
}

export class ProductDetailsDto {
  @ApiPropertyOptional({ example: 'Finca Felipe' })
  @IsOptional()
  @Transform(trim)
  @IsString({ message: 'La marca debe ser un texto' })
  brand?: string;

  @ApiPropertyOptional({ example: 500, minimum: 0, exclusiveMinimum: true })
  @IsOptional()
  @IsPositive({ message: 'El peso debe ser mayor a 0' })
  weight?: number;

  @ApiPropertyOptional({ enum: PRODUCT_UNITS, example: 'g' })
  @IsOptional()
  @IsIn(PRODUCT_UNITS, {
    message: `La unidad debe ser ${PRODUCT_UNITS.slice(0, -1).join(', ')} o ${PRODUCT_UNITS.at(-1)}`,
  })
  unit?: ProductUnit;

  @ApiPropertyOptional({ type: [ProductSpecDto], maxItems: MAX_SPECS })
  @IsOptional()
  @IsArray({ message: 'Las especificaciones deben ser una lista' })
  @ArrayMaxSize(MAX_SPECS, {
    message: `Máximo ${MAX_SPECS} especificaciones`,
  })
  @ValidateNested({
    each: true,
    message: 'Cada especificación debe tener nombre y valor',
  })
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
  @IsString({ message: 'El SKU es obligatorio y debe ser un texto' })
  @Matches(SKU_PATTERN, {
    message:
      'El SKU debe tener de 3 a 20 caracteres: letras mayúsculas, números o guiones',
  })
  sku: string;

  @ApiProperty({ example: 'Café 500g', minLength: 3, maxLength: 100 })
  @Transform(trim)
  @IsString({ message: 'El nombre es obligatorio y debe ser un texto' })
  @Length(3, 100, {
    message: 'El nombre debe tener entre 3 y 100 caracteres',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'Café de origen, tostión media',
    maxLength: 1000,
  })
  @IsOptional()
  @Transform(trim)
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(1000, {
    message: 'La descripción no puede superar los 1000 caracteres',
  })
  description?: string;

  @ApiProperty({ example: 25000, minimum: 0, description: 'Price in COP' })
  @IsInt({ message: 'El precio debe ser un número entero' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  price: number;

  @ApiProperty({ example: 120, minimum: 0 })
  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock: number;

  @ApiProperty({ example: 'Café', minLength: 2, maxLength: 50 })
  @Transform(trim)
  @IsString({ message: 'La categoría es obligatoria y debe ser un texto' })
  @Length(2, 50, {
    message: 'La categoría debe tener entre 2 y 50 caracteres',
  })
  category: string;

  @ApiPropertyOptional({ type: ProductDetailsDto })
  @IsOptional()
  @ValidateNested({ message: 'Los detalles deben ser un objeto' })
  @Type(() => ProductDetailsDto)
  details?: ProductDetailsDto;
}
