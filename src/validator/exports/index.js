const { ExportNotesPayloadSchema } = require('./schema');
// Client Error exceptions.
const InvariantError = require('../../exceptions/InvariantError');

const ExportsValidator = {
  validateExportNotesPayload: (payload) => {
    const validationResult = ExportNotesPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = ExportsValidator;
