const ClientError = require('../../exceptions/ClientError');

class UploadsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
    this.postUploadImageHandler = this.postUploadImageHandler.bind(this);
  }

  async postUploadImageHandler(request, h) {
    try {
      const { cover } = request.payload; // mengambil data readable dari body request
      const { id } = request.params;
      this._validator.validateImageHeaders(cover.hapi.headers); // validasi header data

      const filename = await this._service.writeFile(cover, cover.hapi);
      const fileLocation = `http://${process.env.HOST}:${process.env.PORT}/upload/images/${filename}`;
      await this._service.addCoverAlbum(fileLocation, id);
      const response = h.response({
        status: 'success',
        message: 'Sampul berhasil diunggah',
      });
      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }
      // Server ERROR!
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
