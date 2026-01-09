const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');

const userDataDir = app.getPath('userData');
const dbPath = path.join(userDataDir, 'mediaLibrary.db');
const db = new Database(dbPath);

function initDatabase() {
  // ================= LIBRARY FOLDERS =================
  db.prepare(`
    CREATE TABLE IF NOT EXISTS LibraryFolders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL UNIQUE,
      type TEXT DEFAULT 'mixed', -- 'audio', 'video', 'mixed'
      addedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `).run();

  // ================= ALBUMS =================
  db.prepare(`
    CREATE TABLE IF NOT EXISTS Albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT COLLATE NOCASE,
      artist TEXT COLLATE NOCASE,
      artistID INTEGER,
      albumArt TEXT,
      year INTEGER,
      createdDate INTEGER
    );
  `).run();

  // ================= SONGS =================
  db.prepare(`
    CREATE TABLE IF NOT EXISTS Songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filePath TEXT NOT NULL,
      fileName TEXT,
      extension TEXT,
      fileSize INTEGER,
      createdDate INTEGER,
      modifiedDate INTEGER,
      title TEXT COLLATE NOCASE,
      artist TEXT COLLATE NOCASE,
      artistID INTEGER,
      albumID INTEGER DEFAULT NULL,
      duration REAL,
      genres TEXT,
      genreID INTEGER,
      year INTEGER,
      isFavorite INTEGER DEFAULT 0,
      favDate INTEGER,
      playCounter INTEGER DEFAULT 0,
      lastTimePlayed INTEGER,
      addedDate INTEGER,
      FOREIGN KEY (albumID) REFERENCES Albums(id) ON DELETE SET NULL,
      FOREIGN KEY (artistID) REFERENCES Artists(id) ON DELETE SET NULL,
      FOREIGN KEY (genreID) REFERENCES Genres(id) ON DELETE SET NULL
    );
  `).run();

  // Case-insensitive unique path (CRITICAL)
  db.prepare(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_songs_path
    ON Songs(filePath COLLATE NOCASE);
  `).run();

  // ================= VIDEOS =================
  db.prepare(`
    CREATE TABLE IF NOT EXISTS Videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filePath TEXT NOT NULL,
      title TEXT,
      thumbnail TEXT, -- base64 PNG
      duration REAL,
      fileSize INTEGER,
      addedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `).run();

  db.prepare(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_path
    ON Videos(filePath COLLATE NOCASE);
  `).run();

  // ================= PLAYLISTS =================
  db.prepare(`
    CREATE TABLE IF NOT EXISTS Playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'custom', -- 'custom', 'favorites', 'history'
      thumbnail TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS PlaylistSongs (
      playlistID INTEGER NOT NULL,
      songID INTEGER NOT NULL,
      addedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (playlistID, songID),
      FOREIGN KEY (playlistID) REFERENCES Playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (songID) REFERENCES Songs(id) ON DELETE CASCADE
    );
  `).run();

  // System playlists
  db.prepare(`
    INSERT OR IGNORE INTO Playlists (id, name, type, thumbnail)
    VALUES
      (1, 'Favorites', 'favorites', NULL),
      (2, 'History', 'history', NULL);
  `).run();

  // ================= ARTISTS =================
  db.prepare(`
    CREATE TABLE IF NOT EXISTS Artists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `).run();

  // ================= GENRES =================
  db.prepare(`
    CREATE TABLE IF NOT EXISTS Genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `).run();

  // ================= SEARCH HISTORY =================
  db.prepare(`
    CREATE TABLE IF NOT EXISTS SearchHistory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term TEXT UNIQUE,
      lastUsed INTEGER,
      count INTEGER DEFAULT 1
    );
  `).run();

  // ================= SETTINGS =================
  db.prepare(`
    CREATE TABLE IF NOT EXISTS Settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `).run();

  // Default settings (seed once)
  const defaultSettings = {
    syncWatchEnabled: true,
    hideBarsVideoEnabled: true,
    songLibrarySort: 'added_asc'
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    db.prepare(`
      INSERT INTO Settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO NOTHING
    `).run(key, JSON.stringify(value));
  }

  console.log('-> Database initialized at', dbPath);
  return db;
}

module.exports = { initDatabase };