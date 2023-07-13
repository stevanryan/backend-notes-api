const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class UsersService {
  constructor() {
    this._pool = new Pool();
  }

  async addUser({ username, password, fullname }) {
    // TODO: Verifikasi username, pastikan belum terdaftar.
    // TODO: Bila verifikasi lolos, maka masukkan user baru ke database.
    await this.verifyNewUsername(username);

    const id = `user-${nanoid(16)}`;
    // hash menerima dua parameter yaitu data dan saltRounds.
    // parameter data merupakan nilai yang ingin di-hash.
    // saltRounds merupakan angka untuk menciptakan unpredicted string. 10 adalah standar.
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = {
      text: 'INSERT INTO users VALUES($1, $2, $3, $4) RETURNING id',
      values: [id, username, hashedPassword, fullname],
    };

    const userResult = await this._pool.query(query);

    if (!userResult.rows.length) {
      throw new InvariantError('User gagal ditambahkan');
    }

    return userResult.rows[0].id;
  }

  async verifyNewUsername(username) {
    const query = {
      text: 'SELECT username FROM users WHERE username = $1',
      values: [username],
    };

    const userResult = await this._pool.query(query);

    if (userResult.rows.length > 0) {
      throw new InvariantError('Gagal menambahkan user. Username sudah digunakan.');
    }
  }

  async getUserById(userId) {
    const query = {
      text: 'SELECT id, username, fullname FROM users WHERE id = $1',
      values: [userId],
    };

    const userResult = await this._pool.query(query);

    if (!userResult.rows.length) {
      throw new NotFoundError('User tidak ditemukan');
    }

    return userResult.rows[0];
  }
}

module.exports = UsersService;
