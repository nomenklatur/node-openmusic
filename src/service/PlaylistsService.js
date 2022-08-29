const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../exceptions/InvariantError');
const NotFoundError = require('../exceptions/NotFoundError');
const AuthorizationError = require('../exceptions/AuthorizationError');

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'insert into playlists values($1, $2, $3) returning id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Gagal menambahkan playlist');
    }

    return result.rows[0].id;
  }

  async getPlaylists(user) {
    const query = {
      text: 'select playlists.id, playlists.name, users.username from playlists left join users on users.id = playlists.owner where playlists.owner = $1;',
      values: [user],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async deleteSpecifiedPlaylist(id) {
    const query = {
      text: 'delete from playlists where id = $1 returning id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal menghapus playlist. Id playlist tidak ditemukan');
    }
  }

  async addSongToPlaylist(playlistId, songId) {
    const query = {
      text: 'insert into playlist_songs (playlist_id, song_id) VALUES($1, $2) returning id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Gagal menambahkan lagu ke playlist');
    }
  }

  async getSongsFromPlaylist(playlistId) {
    const query = {
      text: 'select songs.id, songs.title, songs.performer FROM songs LEFT JOIN playlist_songs ON playlist_songs.song_id = songs.id WHERE playlist_songs.playlist_id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async getPlaylistsById(id) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username FROM playlists 
                    LEFT JOIN users ON users.id = playlists.owner 
                    WHERE playlists.id = $1`,
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    return result.rows[0];
  }

  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: 'delete from playlist_songs where playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal dihapus');
    }

    return result.rows;
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'select * from playlists WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    const playlist = result.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak punya akses ke playlist');
    }
  }

  async musicCheck(songId) {
    const checker = {
      text: 'select * from songs where id = $1',
      values: [songId],
    };
    const songIdCheck = await this._pool.query(checker);
    if (!songIdCheck.rows.length) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }
  }
}

module.exports = PlaylistsService;
