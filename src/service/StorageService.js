const fs = require('fs');
const { Pool } = require('pg');
const NotFoundError = require('../exceptions/NotFoundError');

class StorageService {
  constructor(folder) {
    this._folder = folder;
    this._pool = new Pool();

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  }

  writeFile(file, meta) {
    // file merupakan readableStream dari request user
    // meta merupakan obj yang menampung informasi tambahan
    const filename = +new Date() + meta.filename; // nama berkas yang akan dituliskan
    const path = `${this._folder}/${filename}`; // menampung alamat lengkap dari berkas yang akan dituliskan

    const fileStream = fs.createWriteStream(path); // membuat writable stream dari path

    return new Promise((resolve, reject) => {
      fileStream.on('error', (error) => reject(error));
      file.pipe(fileStream); // file readable akan dibuat writeable
      file.on('end', () => resolve(filename));
    });
  }

  async addCoverAlbum(fileLocation, albumsId) {
    const query = {
      text: 'update albums set cover_url = $1 where id = $2 returning id',
      values: [fileLocation, albumsId],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new NotFoundError('Gagal menambahkan cover. Id tidak ditemukan');
    }
  }
}

module.exports = StorageService;
