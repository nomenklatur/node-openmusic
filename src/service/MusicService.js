const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../exceptions/InvariantError');
const NotFoundError = require('../exceptions/NotFoundError');
const { dataFormatter } = require('../utils/formatter');

class MusicService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheing = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);
    const albumId = `album-${id}`;
    const query = {
      text: 'insert into albums values($1, $2, $3) returning id',
      values: [albumId, name, year],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getSpecifiedAlbum(id) {
    const query = {
      text: 'select id, name, year, cover_url from albums where id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }
    return result.rows[0];
  }

  async editSpecifiedAlbum(id, { name, year }) {
    const query = {
      text: 'update albums set name = $1, year = $2 where id = $3 returning id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteSpecifiedAlbum(id) {
    const query = {
      text: 'delete from albums where id = $1 returning id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal menghapus album. Id tidak ditemukan');
    }
  }

  async addSong({
    title, year, performer, genre, duration, albumId,
  }) {
    const id = nanoid(16);
    const songId = `song-${id}`;
    const query = {
      text: 'insert into songs values($1, $2, $3, $4, $5, $6, $7) returning id',
      values: [songId, title, year, performer, genre, duration, albumId],
    };
    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }
    return result.rows[0].id;
  }

  async getSongs() {
    const query = {
      text: 'select id, title, performer from songs',
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async getSpecifiedSong(id) {
    const query = {
      text: 'select * from songs where id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }
    return result.rows.map(dataFormatter)[0];
  }

  async editSpecifiedSong(id, {
    title, year, performer, genre, duration, albumId,
  }) {
    const query = {
      text: 'update songs set title = $1, year = $2, performer = $3, genre = $4, duration = $5, album_id = $6 where id = $7 returning id',
      values: [title, year, performer, genre, duration, albumId, id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }
  }

  async deleteSpecifiedSong(id) {
    const query = {
      text: 'delete from songs where id = $1 returning id',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Gagal menghapus lagu. Id tidak ditemukan');
    }
  }

  async getAlbumLikes(albumId) {
    try {
      const cacheResult = await this._cacheing.get(`likes:${albumId}`);
      return { likes: JSON.parse(cacheResult), isCache: 1 };
    } catch (error) {
      const query = {
        text: 'SELECT user_id FROM user_album_likes where album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);
      const likesCount = result.rows.length;
      await this._cacheing.set(`likes:${albumId}`, JSON.stringify(likesCount));

      return { likes: likesCount };
    }
  }

  async albumLikes(albumId, userId) {
    const query = {
      text: 'select * from user_album_likes where album_id = $1 and user_id = $2',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      await this.Likes(albumId, userId);
    } else {
      await this.Dislikes(albumId, userId);
    }

    await this._cacheing.delete(`likes:${albumId}`);
  }

  async Likes(albumId, userId) {
    const id = `likes-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO user_album_likes VALUES ($1,$2,$3) returning id',
      values: [id, userId, albumId],
    };
    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Gagal menyukai album');
    }
  }

  async Dislikes(albumId, userId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 returning id',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal dislikes album.');
    }
  }

  async albumCheck(albumId) {
    const checker = {
      text: 'select * from albums where id = $1',
      values: [albumId],
    };
    const albumIdCheck = await this._pool.query(checker);
    if (!albumIdCheck.rows.length) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }
  }
}

module.exports = MusicService;
