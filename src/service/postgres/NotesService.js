const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const mapDBToModel = require('../../utils');
const NotFoundError = require('../../exceptions/NotFoundError');

// Menggunakan database PostgreSQL (Migrate technique with node-pg-migrate)
class NotesService {
  constructor() {
    this._pool = new Pool();
  }

  // Karena fungsi query() berjalan secara asynchronous, maka diberi keyword async dan await.
  async addNote({ title, body, tags }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    // Memasukkan notes baru ke dalam database.
    const query = {
      text: 'INSERT INTO notes VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, title, body, tags, createdAt, updatedAt],
    };

    const dataResult = await this._pool.query(query);

    // Ketika id tidak ditemukan, maka dataResult bernilai undefined (falsy). !false maka true.
    if (!dataResult.rows[0].id) {
      throw new InvariantError('Catatan gagal ditambahkan');
    }

    return dataResult.rows[0].id;
  }

  async getNotes() {
    const dataResult = await this._pool.query('SELECT * FROM notes');

    // Mengembalikan data yang telah diubah struktur objek nya menggunakan mapDBToModel.
    return dataResult.rows.map(mapDBToModel);
  }

  async getNoteById(id) {
    const query = {
      text: 'SELECT * FROM notes WHERE id = $1',
      values: [id],
    };

    const dataResult = await this._pool.query(query);

    // Ketika tabel yang dikembalikan memiliki baris 0, maka dataResult bernilai 0 (falsy).
    if (!dataResult.rows.length) {
      throw new NotFoundError('Catatan tidak ditemukan');
    }

    return dataResult.rows.map(mapDBToModel)[0];
  }

  async editNoteById(id, { title, body, tags }) {
    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE notes SET title = $1, body = $2, tags = $3, updated_at = $4 WHERE id = $5 RETURNING id',
      values: [title, body, tags, updatedAt, id],
    };

    const dataResult = await this._pool.query(query);

    if (!dataResult.rows.length) {
      throw new NotFoundError('Gagal memperbarui catatan. Id tidak ditemukan');
    }
  }

  async deleteNoteById(id) {
    const query = {
      text: 'DELETE FROM notes WHERE id = $1 RETURNING id',
      values: [id],
    };

    const dataResult = await this._pool.query(query);

    if (!dataResult.rows.length) {
      throw new NotFoundError('Catatan gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = NotesService;