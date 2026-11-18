import Joi from 'joi';

export const envValidationSchema = Joi.object({
  MONGO_URI: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min': '"JWT_SECRET" must be at least 32 characters long',
  }),
  JWT_EXPIRES_IN: Joi.string()
    .pattern(/^\d+(ms|s|m|h|d)$/)
    .required()
    .messages({
      'string.pattern.base':
        '"JWT_EXPIRES_IN" must be a number followed by a unit (ms, s, m, h or d), e.g. 3600s',
    }),
  PORT: Joi.number().port().required(),
  CORS_ORIGIN: Joi.string().uri().required(),
});
