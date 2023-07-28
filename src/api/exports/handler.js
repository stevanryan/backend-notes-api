const ClientError = require('../../exceptions/ClientError');

class ExportsHandler {
  constructor(service, validator) {
    this._service = service; // init attribute.
    this._validator = validator; // validator attribute.

    // Melakukan binding function.
    // Dilakukan binding supaya mengikat "this" tetap bernilai instance class ExportsHandler
    // Ketika tidak dilakukan binding, maka keyword "this" mengacu pada
    // objek baru yang dibuat, bukan ExportsHandler.
    this.postExportNotesHandler = this.postExportNotesHandler.bind(this);
  }

  async postExportNotesHandler(request, h) {
    try {
      // Validasi data input.
      this._validator.validateExportNotesPayload(request.payload);

      const message = {
        userId: request.auth.credentials.id,
        targetEmail: request.payload.targetEmail,
      };

      // Menggunakan stringify karena parameter hanya menerima bentuk string sehingga harus diubah.
      await this._service.sendMessage('export:notes', JSON.stringify(message));

      const response = h.response({
        status: 'success',
        message: 'Permintaan Anda dalam antrean',
      });
      response.code(201); // Memberikan kode status dari response.
      return response; // Mengembalikan response ke client.
    } catch (error) {
      // Ketika error disebabkan oleh kesalahan user.
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode); // Code error sesuai dengan custom error.
        return response;
      }

      // Server Error. Ketika error disebabkan oleh kesalahan server.
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }
}

module.exports = ExportsHandler;
