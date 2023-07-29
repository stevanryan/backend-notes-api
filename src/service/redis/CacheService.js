const redis = require('redis');

class CacheService {
  constructor() {
    // Membuat private client bernilai client Redis.
    // Menggunakan client tersebut untuk mengoperasikan Redis server.
    this._client = redis.createClient({
      socket: {
        host: process.env.REDIS_SERVER,
      },
    });

    // Membuat client Redis dapat menyebabkan error, sehingga harus dicetak menggunakan console.
    this._client.on('error', (error) => {
      console.error(error);
    });

    this._client.connect();
  }

  // Digunakan untuk menyimpan nilai pada cache.
  async set(key, value, exporationInSecond = 3600) {
    const setResult = await this._client.set(key, value, {
      EX: exporationInSecond,
    });

    // Cek apakah berhasil melakukan menyimpan nilai pada cache.
    console.log(`cache set status: ${setResult}`);
  }

  // Digunakan untuk mendapatkan nilai pada key Redis.
  async get(key) {
    const keyResult = await this._client.get(key);

    if (keyResult === null) {
      // Ketika data pada key bernilai nil, maka bangkitkan error.
      throw new Error('Cache tidak ditemukan');
    }

    return keyResult;
  }

  // Digunakan untuk menghapus nilai pada key Redis.
  delete(key) {
    // Mengembalikan jumlah dari nilai yang dihapus pada cache.
    return this._client.del(key);
  }
}

module.exports = CacheService;
