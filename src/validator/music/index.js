const { albumValidationSchema, songValidationSchema } = require('./schema');
const InvariantError = require('../../exceptions/InvariantError');

const MusicValidator = {
  validateAlbumPayload: (payload) => {
    const validResult = albumValidationSchema.validate(payload);
    if (validResult.error) {
      throw new InvariantError(validResult.error.message);
    }
  },
  validateSongPayload: (payload) => {
    const validResult = songValidationSchema.validate(payload);
    if (validResult.error) {
      throw new InvariantError(validResult.error.message);
    }
  },
};

module.exports = MusicValidator;
