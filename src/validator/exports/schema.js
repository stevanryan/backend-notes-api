const Joi = require('joi');

const ExportNotesPayloadSchema = Joi.object({
  // tlds untuk memaksa email harus menggunakan top-level domain seperti com.
  targetEmail: Joi.string().email({ tlds: true }).required(),
});

module.exports = { ExportNotesPayloadSchema };
