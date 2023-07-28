const path = require('path');

const routes = (handler) => [
  {
    method: 'POST',
    path: '/upload/images',
    handler: handler.postUploadImageHandler,
    options: {
      payload: {
        allow: 'multipart/form-data',
        multipart: true,
        output: 'stream',
      },
    },
  },
  {
    method: 'GET',
    path: '/upload/{param*}',
    // Bila ada permintaan masuk, maka akan dilayani oleh berkas statis
    // yang berada pada folder file.
    handler: {
      directory: {
        path: path.resolve(__dirname, 'file'),
      },
    },
  },
];

module.exports = routes;
