// Mengimport .env dan menjalankan konfigurasi.
require('dotenv').config();

const Hapi = require('@hapi/hapi');

// notes.
const notes = require('./api/notes');
const NotesService = require('./service/postgres/NotesService');
const NotesValidator = require('./validator/notes');

// users.
const users = require('./api/users');
const UsersService = require('./service/postgres/UsersService');
const UsersValidator = require('./validator/users');

const init = async () => {
  const notesService = new NotesService();
  const usersService = new UsersService();
  const server = Hapi.server({
    port: process.env.PORT, // Diambil dari .env
    host: process.env.HOST, // Diambil dari .env
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  // Mendaftarkan plugin di server Hapi.
  await server.register([
    {
      plugin: notes,
      options: {
        service: notesService,
        validator: NotesValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
  ]);

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
