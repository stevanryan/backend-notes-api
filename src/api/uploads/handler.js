const ClientError = require('../../exceptions/ClientError');

class UploadsHandler {
  constructor(service, validator) {
    this._service = service; // init attribute.
    this._validator = validator; // validator attribute.

    // Melakukan binding function.
    // Dilakukan binding supaya mengikat "this" tetap bernilai instance class UploadsHandler
    // Ketika tidak dilakukan binding, maka keyword "this" mengacu pada
    // objek baru yang dibuat, bukan UploadsHandler.
    this.postUploadImageHandler = this.postUploadImageHandler.bind(this);
  }

  async postUploadImageHandler(request, h) {
    try {
      // Mendapatkan data yang merupakan Readable.
      const { data } = request.payload;

      // Validasi data adalah gambar.
      this._validator.validateImageHeaders(data.hapi.headers);

      const filename = await this._service.writeFile(data, data.hapi);

      const response = h.response({
        status: 'success',
        message: 'Gambar berhasil diupload',
        data: {
          // Lokasi file dari gambar.
          fileLocation: `http://${process.env.HOST}:${process.env.PORT}/upload/images/${filename}`,
        },
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

module.exports = UploadsHandler;
