import Joi from 'joi';

export const envValidationSchema = Joi.object({
  MONGO_URI: Joi.string().uri().required(),
  PORT: Joi.number().port().default(3000),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
});
