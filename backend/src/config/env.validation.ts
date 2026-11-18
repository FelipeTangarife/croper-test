import Joi from 'joi';

export const envValidationSchema = Joi.object({
  MONGO_URI: Joi.string().uri().required(),
  PORT: Joi.number().port().default(3000),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string()
    .pattern(/^\d+(ms|s|m|h|d)$/)
    .default('3600s')
    .messages({
      'string.pattern.base':
        'JWT_EXPIRES_IN must be a number followed by a unit (ms, s, m, h or d), e.g. 3600s',
    }),
});
