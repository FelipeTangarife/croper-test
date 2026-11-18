import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiBearerAuth,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto.js';
import {
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from './dto/product-response.dto.js';
import { QueryProductsDto } from './dto/query-products.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductsService } from './products.service.js';

const idParam = ApiParam({
  name: 'id',
  description: 'Product ObjectId',
  example: '665f1c2e8b3a4d0012a1b2c3',
});

@ApiTags('products')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, invalid or expired token' })
@ApiTooManyRequestsResponse({
  description: 'Demasiados intentos, espera un minuto',
})
@Controller('products')
export class ProductsController {
  constructor(
    @Inject(ProductsService) private readonly productsService: ProductsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List active products, paginated and searchable' })
  @ApiOkResponse({ type: PaginatedProductsResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @idParam
  @ApiOperation({ summary: 'Get an active product by id' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid ObjectId',
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
  })
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a product' })
  @ApiCreatedResponse({ type: ProductResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({
    description: 'Ya existe un producto con ese SKU',
  })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @idParam
  @ApiOperation({ summary: 'Update any product field except the SKU' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed or invalid id' })
  @ApiNotFoundResponse({
    description: 'Product not found',
  })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @idParam
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a product' })
  @ApiNoContentResponse({ description: 'Product deleted' })
  @ApiBadRequestResponse({
    description: 'Invalid ObjectId',
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
  })
  remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.productsService.remove(id);
  }
}
