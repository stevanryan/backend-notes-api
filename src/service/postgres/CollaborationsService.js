const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class CollaborationsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addCollaboration(noteId, userId) {
    const id = `collab-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO collaborations VALUES($1, $2, $3) RETURNING id',
      values: [id, noteId, userId],
    };

    const collaborationResult = await this._pool.query(query);

    if (!collaborationResult.rows.length) {
      throw new InvariantError('Kolaborasi gagal ditambahkan');
    }

    // Menghapus cache yang disimpan (sehingga cache selalu update).
    await this._cacheService.delete(`notes:${userId}`);

    return collaborationResult.rows[0].id;
  }

  async deleteCollaboration(noteId, userId) {
    const query = {
      text: 'DELETE FROM collaborations WHERE note_id = $1 AND user_id = $2 RETURNING id',
      values: [noteId, userId],
    };

    const collaborationResult = await this._pool.query(query);

    if (!collaborationResult.rows.length) {
      throw new NotFoundError('Kolaborasi gagal dihapus');
    }

    // Menghapus cache yang disimpan (sehingga cache selalu update).
    await this._cacheService.delete(`notes:${userId}`);
  }

  // Memastikan kolaborasi ada di dalam database.
  async verifyCollaborator(noteId, userId) {
    const query = {
      text: 'SELECT * FROM collaborations WHERE note_id = $1 AND user_id = $2',
      values: [noteId, userId],
    };

    const collaborationResult = await this._pool.query(query);

    if (!collaborationResult.rows.length) {
      throw new InvariantError('Kolaborasi gagal diverifikasi');
    }
  }
}

module.exports = CollaborationsService;
