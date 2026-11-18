import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto.js';
import { QueryProductsDto } from './dto/query-products.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Product, ProductDocument } from './schemas/product.schema.js';

type ProductId = string | Types.ObjectId;

const DUPLICATE_KEY_ERROR = 11000;
const NOT_FOUND_MESSAGE = 'Producto no encontrado';
const DUPLICATE_SKU_MESSAGE = 'Ya existe un producto con ese SKU';

export interface PaginatedProducts {
  data: ProductDocument[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isDuplicateKeyError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  (error as { code?: unknown }).code === DUPLICATE_KEY_ERROR;

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async findAll({
    page,
    limit,
    search,
    sortBy,
    order,
  }: QueryProductsDto): Promise<PaginatedProducts> {
    const filter: QueryFilter<Product> = { isActive: true };
    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: pattern }, { sku: pattern }];
    }

    const direction = order === 'asc' ? 1 : -1;
    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort({ [sortBy]: direction, _id: direction })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: ProductId): Promise<ProductDocument> {
    const product = await this.productModel
      .findOne({ _id: id, isActive: true })
      .exec();
    if (!product) throw new NotFoundException(NOT_FOUND_MESSAGE);
    return product;
  }

  async create(dto: CreateProductDto): Promise<ProductDocument> {
    try {
      return await this.productModel.create(dto);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(DUPLICATE_SKU_MESSAGE);
      }
      throw error;
    }
  }

  async update(id: ProductId, dto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.productModel
      .findOneAndUpdate({ _id: id, isActive: true }, dto, {
        returnDocument: 'after',
        runValidators: true,
      })
      .exec();
    if (!product) throw new NotFoundException(NOT_FOUND_MESSAGE);
    return product;
  }

  async remove(id: ProductId): Promise<void> {
    const { matchedCount } = await this.productModel
      .updateOne({ _id: id, isActive: true }, { isActive: false })
      .exec();
    if (matchedCount === 0) throw new NotFoundException(NOT_FOUND_MESSAGE);
  }
}
