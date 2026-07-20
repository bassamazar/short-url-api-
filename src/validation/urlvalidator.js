import Joi from 'joi';

export const shortenUrlSchema = Joi.object({
    originalUrl: Joi.string().uri().required().messages({
        'string.uri': 'Invalid URL, please ensure it includes http:// or https://',
        'any.required': 'Original URL is required'
    }),
    customCode: Joi.string().alphanum().min(3).max(10).messages({
        'string.alphanum': 'Custom code must only contain alphanumeric characters',
        'string.min': 'Custom code must be at least 3 characters long',
        'string.max': 'Custom code cannot exceed 10 characters'
    })
});

