import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const PRODUCT_UNITS = ['kg', 'g', 'l', 'ml', 'unidad'] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

export const SKU_PATTERN = /^[A-Z0-9-]{3,20}$/;
export const MAX_SPECS = 20;

@Schema({ _id: false })
export class ProductSpec {
  @Prop({ type: String, required: true, trim: true })
  key: string;

  @Prop({ type: String, required: true, trim: true })
  value: string;
}

const ProductSpecSchema = SchemaFactory.createForClass(ProductSpec);

@Schema({ _id: false })
export class ProductDetails {
  @Prop({ type: String, trim: true })
  brand?: string;

  @Prop({
    type: Number,
    validate: {
      validator: (v: number) => v > 0,
      message: 'weight must be greater than 0',
    },
  })
  weight?: number;

  @Prop({ type: String, enum: PRODUCT_UNITS })
  unit?: ProductUnit;

  @Prop({
    type: [ProductSpecSchema],
    default: undefined,
    validate: {
      validator: (v: ProductSpec[]) => v.length <= MAX_SPECS,
      message: `specs cannot exceed ${MAX_SPECS} items`,
    },
  })
  specs?: ProductSpec[];
}

const ProductDetailsSchema = SchemaFactory.createForClass(ProductDetails);

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret._id;
      return ret;
    },
  },
})
export class Product {
  @Prop({
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    match: SKU_PATTERN,
    immutable: true,
  })
  sku: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100,
  })
  name: string;

  @Prop({ type: String, trim: true, maxlength: 1000 })
  description?: string;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'price must be an integer',
    },
  })
  price: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'stock must be an integer',
    },
  })
  stock: number;

  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  })
  category: string;

  @Prop({ type: ProductDetailsSchema })
  details?: ProductDetails;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export type ProductDocument = HydratedDocument<Product>;

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index(
  { sku: 1 },
  { unique: true, partialFilterExpression: { isActive: true } },
);
