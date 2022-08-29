const Joi = require('joi');

const albumValidationSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().required(),
});

const songValidationSchema = Joi.object({
  title: Joi.string().required(),
  year: Joi.number().required(),
  genre: Joi.string().required(),
  performer: Joi.string().required(),
  duration: Joi.number(),
  albumId: Joi.string(),
});

module.exports = { albumValidationSchema, songValidationSchema };
