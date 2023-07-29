const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const mapDBToModel = require('../../utils');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

// Menggunakan database PostgreSQL (Migrate technique with node-pg-migrate)
class NotesService {
  constructor(collaborationService, cacheService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
    this._cacheService = cacheService;
  }

  // Karena fungsi query() berjalan secara asynchronous, maka diberi keyword async dan await.
  async addNote({
    title, body, tags, owner,
  }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    // Memasukkan notes baru ke dalam database.
    const query = {
      text: 'INSERT INTO notes VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, title, body, tags, createdAt, updatedAt, owner],
    };

    const dataResult = await this._pool.query(query);

    // Ketika id tidak ditemukan, maka dataResult bernilai undefined (falsy). !false maka true.
    if (!dataResult.rows[0].id) {
      throw new InvariantError('Catatan gagal ditambahkan');
    }

    // Menghapus cache yang disimpan (sehingga cache selalu update).
    await this._cacheService.delete(`notes:${owner}`);

    return dataResult.rows[0].id;
  }

  async getNotes(owner) {
    try {
      // Mendapatkan data notes dari cache.
      const dataResult = await this._cacheService.get(`notes:${owner}`);
      return JSON.parse(dataResult);
    } catch (error) {
      // Jika gagal, akan mengambil data notes dari database.
      const query = {
        text: `SELECT notes.* FROM notes
              LEFT JOIN collaborations ON collaborations.note_id = notes.id
              WHERE notes.owner = $1 OR collaborations.user_id = $1
              GROUP BY notes.id`,
        values: [owner],
      };

      const dataResult = await this._pool.query(query);
      const dataMappedResult = dataResult.rows.map(mapDBToModel);

      // Menyimpan data notes pada cache terlebih dahulu sebelum getNotes melakukan return.
      await this._cacheService.set(`notes:${owner}`, JSON.stringify(dataMappedResult));

      return dataMappedResult;
    }
  }

  async getNoteById(id) {
    const query = {
      text: `SELECT notes.*, users.username
            FROM notes
            LEFT JOIN users ON users.id = notes.owner
            WHERE notes.id = $1`,
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
      text: 'UPDATE notes SET title = $1, body = $2, tags = $3, updated_at = $4 WHERE id = $5 RETURNING id, owner',
      values: [title, body, tags, updatedAt, id],
    };

    const dataResult = await this._pool.query(query);

    if (!dataResult.rows.length) {
      throw new NotFoundError('Gagal memperbarui catatan. Id tidak ditemukan');
    }

    // Menghapus cache yang disimpan (sehingga cache selalu update).
    const { owner } = dataResult.rows[0];
    await this._cacheService.delete(`notes:${owner}`);
  }

  async deleteNoteById(id) {
    const query = {
      text: 'DELETE FROM notes WHERE id = $1 RETURNING id, owner',
      values: [id],
    };

    const dataResult = await this._pool.query(query);

    if (!dataResult.rows.length) {
      throw new NotFoundError('Catatan gagal dihapus. Id tidak ditemukan');
    }

    // Menghapus cache yang disimpan (sehingga cache selalu update).
    const { owner } = dataResult.rows[0];
    await this._cacheService.delete(`notes:${owner}`);
  }

  // Untuk verifikasi apakah note dengan id yang direquest memiliki hak untuk diminta.
  async verifyNoteOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM notes WHERE id = $1',
      values: [id],
    };

    const dataResult = await this._pool.query(query);

    if (!dataResult.rows.length) {
      throw new NotFoundError('Catatan tidak ditemukan');
    }

    const note = dataResult.rows[0];

    if (note.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  // Untuk menentukan hak akses user baik sebagai owner ataupun kolaborator note.
  async verifyNoteAccess(noteId, userId) {
    try {
      await this.verifyNoteOwner(noteId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        await this._collaborationService.verifyCollaborator(noteId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = NotesService;
