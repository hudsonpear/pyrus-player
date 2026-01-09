const { app, BrowserWindow, dialog, ipcMain, shell, protocol, nativeImage, Menu } = require('electron');

app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
/* app.commandLine.appendSwitch('enable-zero-copy'); */
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('use-angle', 'd3d11');

app.setName("Pyrus Player");

const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const { autoUpdater } = require('electron-updater');
const { pathToFileURL } = require('url');
const Database = require('better-sqlite3');
const mm = require('music-metadata');
const child_process = require('child_process'); 
const sharp = require('sharp');
const chokidar = require("chokidar");

let ffmpegPath = require("ffmpeg-static");
let ffprobePath = require("ffprobe-static").path;

if (ffmpegPath.includes("app.asar")) {
  ffmpegPath = ffmpegPath.replace("app.asar", "app.asar.unpacked");
}

if (ffprobePath.includes("app.asar")) {
  ffprobePath = ffprobePath.replace("app.asar", "app.asar.unpacked");
}

const { initDatabase } = require('./initDatabase.js');

const audioExts = ['.mp3','.wav','.ogg','.flac','.aac','.m4a'];
const videoExts = ['.mp4','.webm','.mkv','.mov','.m4v'];

const allowedExtensions = {
  audio: ['.mp3','.wav','.ogg','.flac','.aac','.m4a'],
  video: ['.mp4','.webm','.mkv','.mov','.m4v'],
  both: ['audio', 'video']
};

let db;
db = initDatabase(); // Initialize and create tables here

let watchFolders = [];
let watcher = null;
let cachedSongs = new Set();
let cachedVideos = new Set();

let isSyncRunning = false;
let watcherReady = false;
let suppressWatcherEvents = false;

function normalizePath(p) {
  if (!p) return p;
  // normalize separators and lower-case on Windows to avoid case issues
  let np = path.normalize(p);
  if (process.platform === 'win32') {
    np = np.toLowerCase();
    np = np.replace(/\\/g, '/');  // convert all \ to /
  }
  return np;
}

// C:\*\AppData\Roaming\pyrus player
const userDataDir = app.getPath('userData');

const queueFilePath = path.join(userDataDir, "playingQueue.json");

if (!fs.existsSync(queueFilePath)) {
  fs.writeFileSync(queueFilePath, JSON.stringify({
    currentSong: null,
    queue: []
  }, null, 2));
}

const settingsPath = path.join(userDataDir, 'settings.json');

// Folder to store album art
const albumArtDir = path.join(userDataDir, 'album_art');
const videoThumbDir = path.join(userDataDir, 'video_thumbs');

if (!fs.existsSync(albumArtDir)) fs.mkdirSync(albumArtDir, { recursive: true });
if (!fs.existsSync(videoThumbDir)) fs.mkdirSync(videoThumbDir, { recursive: true });

let mainWindow;

let windows = [];

function createMainWindow() {
  //const startMaximized = settings.startMaximized === true;

  const win = new BrowserWindow({
    title: "Pyrus Player",
    width: 1000,
    height: 700,
    autoHideMenuBar: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        sandbox: false,
        powerPreferences: "high-performance",
        backgroundThrottling: false,
         contentSecurityPolicy: `
          default-src 'self';
          script-src 'self';
          style-src 'self' 'unsafe-inline';
          media-src 'self' file:;
          img-src 'self' data: file:;
          font-src 'self';
          connect-src 'self';
        `,
    },
  });
  win.webContents.on('will-navigate', e => e.preventDefault());

  //if (startMaximized) win.maximize();

  win.loadFile('index.html');

  //const menu = Menu.buildFromTemplate(createMenuTemplate(win));
  //win.setMenu(menu);

  windows.push(win);

  win.on('closed', () => {
    windows = windows.filter(w => w !== win);
  });

  ipcMain.on("minimize-window", () => win.minimize());

  ipcMain.on("max-unmax-window", () => {
      if (win.isMaximized()) {
          win.unmaximize();
      } 
      else {
          win.maximize();
      }
  });
  ipcMain.on("close-window", () => win.close());

  ipcMain.handle('isWindowMaximized', () => {
      return win.isMaximized();
  });

  //win.setProgressBar(0.5, { mode: 'normal' });

  updateThumbar({ sender: win.webContents }, false);

  return win;
}

app.on('browser-window-created', (_, window) => {
  window.setIcon(path.join(__dirname, 'images', 'pplogo.ico'));
});

// ----- OPEN MULTIPLE WINDOW ON APP ICON ----- 
const gotTheLock = app.requestSingleInstanceLock();

function extractMediaFromArgs(argv) {
  return argv.find(arg => {
    const ext = path.extname(arg).toLowerCase();
    return audioExts.includes(ext) || videoExts.includes(ext);
  });
}

if (!gotTheLock) {
  app.quit();
  return;
}
app.on("second-instance", (_event, argv) => {
  if (!mainWindow) return;

  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();

  const mediaFile = extractMediaFromArgs(argv);
  if (mediaFile && mainWindow?.webContents) {
    mainWindow.webContents.send("open-media-file", mediaFile);
  }
});

app.whenReady().then(() => {
  mainWindow = createMainWindow();

  const startupFile = extractMediaFromArgs(process.argv);

  if (startupFile) {
    mainWindow.webContents.once("did-finish-load", () => {
      mainWindow.webContents.send("open-media-file", startupFile);
    });
  }

  app.on("activate", () => {
    if (!mainWindow) {
      mainWindow = createMainWindow();
    }
  });

  loadWatchFolders();
});

ipcMain.on('update-playback-state', (event, data) => {
  const win = BrowserWindow.fromWebContents(event.sender);

  if (!win) return;

  const { isPlaying = false, currentTime = 0, duration = 0, title, artist } = data;

  let progress = -1;

  if (duration > 0) {
    progress = Math.max(0, Math.min(1, currentTime / duration));
  
    if (progress > 0 && progress < 0.02) progress = 0.02;

    win.setProgressBar(progress, { mode: isPlaying ? 'normal' : 'paused' });
  } 
  else {
    // no duration => remove progress
    win.setProgressBar(-1);
  }

  // Build a safe title (only if we have progress computed)
  if (isPlaying && progress >= 0) {
    const pct = Math.round(progress * 100);
    const shortInfo = title ? ` — ${title}${artist ? ' — ' + artist : ''}` : '';
    //win.setTitle(`🎵 Playing ${pct}%${shortInfo}`);
    win.setTitle(`${title} - Pyrus Player`);
  } 
  else if (!isPlaying && currentTime > 0 && duration > 0) {
    //win.setTitle(`⏸️ Paused — ${formatTime(currentTime)}`);
    win.setTitle(`${title} - Pyrus Player`);
  } 
  else {
    win.setTitle('Pyrus Player'); // default title when stopped
  }

  // Update thumbar button
  updateThumbar(event, isPlaying);
});

function formatTime(seconds) {
  if (isNaN(seconds)) return '00:00';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    // Show hours if duration is 1 hour or more
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } 
  else {
    // Otherwise, show only mm:ss
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }
}

// TASKBAR CONTROLS

// after you create your BrowserWindow:
const playIcon = nativeImage.createFromPath(path.join(__dirname, 'images', 'taskbar/play_white.png'));
const pauseIcon = nativeImage.createFromPath(path.join(__dirname, 'images', 'taskbar/pause_white.png'));
const prevIcon = nativeImage.createFromPath(path.join(__dirname, 'images', 'taskbar/previous_white.png'));
const nextIcon = nativeImage.createFromPath(path.join(__dirname, 'images', 'taskbar/next_white.png'));

function updateThumbar(event, isPlaying) {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  win.setThumbarButtons([
    {
      tooltip: 'Previous',
      icon: prevIcon,
      click: () => win.webContents.send('thumbnail-control', 'prev')
    },
    {
      tooltip: isPlaying ? 'Pause' : 'Play',
      icon: isPlaying ? pauseIcon : playIcon,
      click: () => win.webContents.send('thumbnail-control', isPlaying ? 'pause' : 'play')
    },
    {
      tooltip: 'Next',
      icon: nextIcon,
      click: () => win.webContents.send('thumbnail-control', 'next')
    }
  ]); 
}

function getOrCreateAlbumId(albumName, albumArtist, albumArtPath, year) {
  if (!albumName && !albumArtist) return -1; // Unknown album

  const existing = db.prepare(`
    SELECT id FROM Albums WHERE name = ? AND artist = ?
  `).get(albumName || 'Unknown Album', albumArtist || 'Unknown Artist');

  if (existing) return existing.id;

  const info = db.prepare(`
    INSERT INTO Albums (name, artist, albumArt, year, createdDate)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    albumName || 'Unknown Album',
    albumArtist || 'Unknown Artist',
    albumArtPath || null,
    year || null,
    Date.now()
  );

  return info.lastInsertRowid;
}

function getAlbumId(albumName, albumArtist) {
  // Return null if no album info
  if (!albumName && !albumArtist) return null;

  const existing = db.prepare(`
    SELECT id FROM Albums WHERE name = ? AND artist = ?
  `).get(albumName || 'Unknown Album', albumArtist || 'Unknown Artist');

  if (existing) return existing.id;

  const info = db.prepare(`
    INSERT INTO Albums (name, artist, albumArt, year, createdDate)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    albumName || 'Unknown Album',
    albumArtist || 'Unknown Artist',
    null, // albumArt
    null, // year
    Date.now()
  );

  return info.lastInsertRowid;
}

function loadCachedLibrary2() {
  const songs = db.prepare("SELECT filePath FROM Songs").all();
  cachedSongs = new Set(songs.map(r => normalizePath(r.filePath)));

  const videos = db.prepare("SELECT filePath FROM Videos").all();
  cachedVideos = new Set(videos.map(r => normalizePath(r.filePath)));
}

function loadCachedLibrary() {
  // Clear without replacing
  cachedSongs.clear();
  cachedVideos.clear();

  // Load fresh data
  const songs = db.prepare("SELECT filePath FROM Songs").all();
  for (const row of songs) {
    cachedSongs.add(normalizePath(row.filePath));
  }

  const videos = db.prepare("SELECT filePath FROM Videos").all();
  for (const row of videos) {
    cachedVideos.add(normalizePath(row.filePath));
  }
}


function updateSongPath2(oldPath, newPath) {
  db.prepare(`UPDATE Songs SET filePath = ? WHERE filePath = ?`).run(newPath, oldPath);
  cachedSongs.delete(normalizePath(oldPath));
  cachedSongs.add(normalizePath(newPath))
}

function updateSongPath(oldPath, newPath) {
  const oldNorm = normalizePath(oldPath);
  const newNorm = normalizePath(newPath);

  db.prepare(`UPDATE Songs SET filePath = ? WHERE filePath = ?`).run(newNorm, oldNorm);

  cachedSongs.delete(oldNorm);
  cachedSongs.add(newNorm);
}


function updateVideoPath(oldPath, newPath) {
  db.prepare(`UPDATE Videos SET filePath = ? WHERE filePath = ?`).run(newPath, oldPath);
  cachedVideos.delete(normalizePath(oldPath));
  cachedVideos.add(normalizePath(newPath));
}

//-----------------------------------------------------

function tryRelocateFile(originalPath) {
  if (fs.existsSync(originalPath)) return originalPath;

  const fileName = path.basename(originalPath);

  for (const root of watchFolders) {
    const found = findFileRecursive(root, fileName);
    if (found) return found;
  }

  return null;
}

function findFileRecursive(dir, target) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      
      if (stat.isDirectory()) {
        const result = findFileRecursive(full, target);
        if (result) return result;
      }
      if (stat.isFile() && file === target) {
        return full;
      }
    }
  } catch {}
  return null;
}

/* =-=-=-=-=-=-=-ADD MUSIC/VIDEO=-=-=-=-=-=-=-= */

function getOrCreateArtistId(artistName) {
  const name = (artistName || "Unknown Artist").trim();

  // Check if artist already exists
  const existing = db.prepare(`SELECT id FROM Artists WHERE name = ?`).get(name);
  if (existing) return existing.id;

  // Only insert when not found
  const info = db.prepare(`INSERT INTO Artists (name) VALUES (?)`).run(name);
  return info.lastInsertRowid;
}

function getOrCreateGenreId(genreName) {
  if (!genreName || !genreName.trim()) return null;

  const cleanName = genreName.trim();
  const existing = db.prepare(`SELECT id FROM Genres WHERE name = ?`).get(cleanName);
  if (existing) return existing.id;

  const info = db.prepare(`INSERT INTO Genres (name) VALUES (?)`).run(cleanName);
  return info.lastInsertRowid;
}

function insertSong(data) {
  // Get or create artist ID
  const artistID = getOrCreateArtistId(data.artist);
  const genreID = getOrCreateGenreId(data.genres);

  // Merge into data (keep artist text for now)
  const fullData = { ...data, artistID, genreID };

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO Songs (
      filePath, fileName, extension, fileSize,
      createdDate, modifiedDate, title, artist,
      artistID, albumID, duration, genres, genreID, year,
      isFavorite, playCounter, lastTimePlayed, addedDate
    ) VALUES (
      @filePath, @fileName, @extension, @fileSize,
      @createdDate, @modifiedDate, @title, @artist,
      @artistID, @albumID, @duration, @genres, @genreID, @year,
      0, 0, NULL, @addedDate
    )
  `);

  const result = stmt.run(fullData);
  return result.lastInsertRowid;
}

// Save video entry
function insertVideo(data) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO Videos (filePath, title, thumbnail, duration, fileSize)
    VALUES (@filePath, @title, @thumbnail, @duration, @fileSize)
  `);
  stmt.run(data);
}

async function readAudioMetadata(filePath) {
  try {
    const metadata = await mm.parseFile(filePath, { duration: true });
    const { common, format } = metadata;

    // Extract album art if available
    let albumArtPath = null;
    if (common.picture && common.picture.length > 0) {
      albumArtPath = await saveAlbumArtAsJpg(common.picture[0]);
    }

    // ---- Normalize artist, album, title ----
    const artist = (common.artist || 'Unknown Artist').normalize('NFC').trim();
    const albumName = common.album ? common.album.normalize('NFC').trim() : null;

    const title = common.title
      ? common.title.normalize('NFC').trim()
      : path.basename(filePath, path.extname(filePath));

    // ---- Get or create album ----
    const albumID = getAlbumIdWithArt(
      albumName,
      common.albumartist || artist,
      albumArtPath
    );


    // Build final metadata object
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const extension = path.extname(filePath).toLowerCase();

    return {
      filePath,
      fileName,
      extension,
      fileSize: stats.size,
      createdDate: Math.floor(stats.birthtimeMs),
      modifiedDate: Math.floor(stats.mtimeMs),
      title,
      artist,
      albumID,
      duration: format.duration || 0,
      genres: (common.genre && common.genre.join(', ')) || '',
      year: common.year || null,
      addedDate: Date.now()
    };
  } 
  catch (err) {
    console.warn(`! Error reading metadata for ${filePath}:`, err.message);

    const stats = fs.statSync(filePath);
    const extension = path.extname(filePath).toLowerCase();

    return {
      filePath,
      fileName: path.basename(filePath),
      extension,
      fileSize: stats.size,
      createdDate: Math.floor(stats.birthtimeMs),
      modifiedDate: Math.floor(stats.mtimeMs),
      title: path.basename(filePath, extension),
      artist: 'Unknown Artist',
      albumID: null,
      duration: 0,
      genres: '',
      year: null,
      addedDate: Date.now()
    };
  }
}

function getAlbumIdWithArt(albumName, albumArtist, albumArtPath) {
  // Normalize values
  const name = albumName?.trim() || '';
  const artist = albumArtist?.trim() || '';

  // IF UNKNOWN, RETURN NULL (don't create or assign album)
  const isUnknownName = !name || name.toLowerCase() === 'unknown album';
  const isUnknownArtist = !artist || artist.toLowerCase() === 'unknown artist';

  if (isUnknownName || isUnknownArtist) {
    return null; // <-- Important fix
  }

  // Try to find real existing album
  const existing = db.prepare(`
    SELECT id, albumArt FROM Albums WHERE name = ? AND artist = ?
  `).get(name, artist);

  if (existing) {
    // Update missing albumArt only
    if (albumArtPath && !existing.albumArt) {
      db.prepare(`UPDATE Albums SET albumArt = ? WHERE id = ?`)
        .run(albumArtPath, existing.id);
    }
    return existing.id;
  }

  // Create new album
  const info = db.prepare(`
    INSERT INTO Albums (name, artist, albumArt, year, createdDate)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, artist, albumArtPath || null, null, Date.now());

  return info.lastInsertRowid;
}

/* THUMB FROM THE MIDDLE OF THE VIDEO */
function extractVideoThumbnail(filePath) {
  const hash = crypto.createHash('md5').update(filePath).digest('hex');
  const thumbPath = path.join(videoThumbDir, `${hash}.jpg`);

  if (fs.existsSync(thumbPath)) return thumbPath;

  try {
    const duration = getVideoDuration(filePath);
    //const seekTime = duration > 0 ? duration * 0.25 : 1; // 25% of total duration, fallback 1s
    const seekTime = duration > 0 ? duration * 0.25 : 0.5;
    child_process.execSync(
      `"${ffmpegPath}" -y -ss ${seekTime} -i "${filePath}" -vframes 1 \
      -vf "scale=160:90:force_original_aspect_ratio=decrease,pad=160:90:(ow-iw)/2:(oh-ih)/2:black" \
      -q:v 4 "${thumbPath}"`,
      { stdio: 'ignore' }
    );

    return thumbPath;
  } 
  catch (err) {
    console.warn(`! Failed to extract thumbnail for ${filePath}:`, err.message);
    return null;
  }
}

function getVideoDuration(filePath) {
  try {
    // Run ffmpeg to get video info
    const result = child_process.execSync(
      `"${ffmpegPath.replace(/\\/g,'\\\\')}" -i "${filePath}"`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    // If ffmpeg prints info to stderr, catch it
  } 
  catch (err) {
    const stderr = err.stderr?.toString() || err.message || '';
    const match = stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const seconds = parseFloat(match[3]);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  }
}

// Recursive folder scan
function getFilesRecursively(dir, audioExts, videoExts) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, audioExts, videoExts));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (audioExts.includes(ext) || videoExts.includes(ext)) results.push(fullPath);
    }
  }
  return results;
}

async function saveAlbumArtAsJpg(picture) {
  if (!picture || !picture.data) return null;

  const buffer = Buffer.from(picture.data);
  const hash = crypto.createHash('md5').update(buffer).digest('hex');
  const filePath = path.join(albumArtDir, `${hash}.jpg`);

  if (fs.existsSync(filePath)) return filePath;

  try {
    // Sharp can usually auto-detect format from the buffer
    await sharp(buffer)
      .resize(120, 120)
      .jpeg({ quality: 80 })
      .toFile(filePath);

    return filePath;
  } catch (err) {
    console.warn(`! Failed to process album art: ${err.message}`);
    return null;
  }
}

// ====== IPC HANDLERS ======

async function getPartialFileHash(filePath, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath, { start: 0, end: maxBytes - 1 });
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function getFullFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

ipcMain.handle('add-songs', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);

  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select Audio Files',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Audio Files', extensions: ['mp3','wav','ogg','flac','aac','m4a'] }]
  });

  if (canceled || !filePaths.length) return;

  let total = filePaths.length;
  let processed = 0;

  for (const filePath of filePaths) {

    if (cachedSongs.has(normalizePath(filePath))) {
      processed++;
      sendProgress(win, processed, total);
      continue;
    }

    const songData = await readAudioMetadata(filePath);
    //insertSong(songData);
    //cachedSongs.add(normalizePath(filePath));
    songData.filePath = normalizePath(songData.filePath);
    insertSong(songData);
    cachedSongs.add(songData.filePath);

    processed++;
    sendProgress(win, processed, total);
  }

});

ipcMain.handle('add-videos', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);

  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select Video Files',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Video', extensions: ['mp4','webm','ogg','mkv','mov','m4v'] }]
  });

  if (canceled || !filePaths.length) return;

  let processed = 0;
  const total = filePaths.length;

  for (const file of filePaths) {
    if (cachedVideos.has(normalizePath(file))) {
      processed++;
      sendProgress(win, processed, total);
      continue;
    }

    const stats = fs.statSync(file); // get file size
    const thumb = extractVideoThumbnail(file);
    const duration = getVideoDuration(file);
    const norm = normalizePath(file);
    insertVideo({
      filePath: norm,
      title: path.basename(file),
      thumbnail: thumb,
      duration,
      fileSize: stats.size // new
    });

    cachedVideos.add(normalizePath(file));

    processed++;
    sendProgress(win, processed, total);
  }
});

ipcMain.handle('add-folders', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);

  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select Folder(s)',
    properties: ['openDirectory', 'multiSelections']
  });

  if (canceled || !filePaths.length) return;

  const selectedType = "mixed";
  const insertFolder = db.prepare(`
    INSERT OR IGNORE INTO LibraryFolders (path, type)
    VALUES (?, ?)
  `);

  //filePaths.forEach(folder => insertFolder.run(folder, selectedType));
  filePaths.forEach(folder =>
    insertFolder.run(normalizePath(folder), selectedType)
  );

  // Reload and start watcher
  //loadWatchFolders();

  // --- Gather all files (audio + video) ---
  let allFiles = [];
  for (const folder of filePaths) {
    allFiles.push(...getFilesRecursively(folder, audioExts, videoExts));
  }

  let processed = 0;
  const total = allFiles.length;

  for (const file of allFiles) {
    const ext = path.extname(file).toLowerCase();

    if (audioExts.includes(ext)) {
      if (!cachedSongs.has(normalizePath(file))) {
        // Try to relocate if moved
        for (const dbPath of cachedSongs) {
          const recovered = tryRelocateFile(dbPath);
          if (recovered && recovered !== dbPath) {
            updateSongPath(dbPath, recovered);
            break;
          }
        }

        const songData = await readAudioMetadata(file);
        //insertSong(songData);
        //cachedSongs.add(normalizePath(file));
        songData.filePath = normalizePath(songData.filePath);
        insertSong(songData);
        cachedSongs.add(songData.filePath);
      }
    } 
    else if (videoExts.includes(ext)) {
      if (!cachedVideos.has(normalizePath(file))) {
        // Get file info
        const stats = fs.statSync(file);
        const thumb = extractVideoThumbnail(file);
        const duration = getVideoDuration(file);

        const norm = normalizePath(file);
        
        insertVideo({
          filePath: norm,
          title: path.basename(file),
          thumbnail: thumb,
          duration,
          fileSize: stats.size, // added
        });

        cachedVideos.add(normalizePath(file));
      }
    }

    processed++;
    sendProgress(win, processed, total);
  }
  
  await refreshLibraryFolders();

  // Notify frontend to reload folder list once done
  //win.webContents.send('folders-updated');
});

ipcMain.handle('add-audio-folders', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);

  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select Audio Folder(s)',
    properties: ['openDirectory', 'multiSelections']
  });

  if (canceled || !filePaths.length) return;

  const selectedType = "audio";
  const insertFolder = db.prepare(`
    INSERT OR IGNORE INTO LibraryFolders (path, type)
    VALUES (?, ?)
  `);

  //filePaths.forEach(folder => insertFolder.run(folder, selectedType));
  filePaths.forEach(folder =>
    insertFolder.run(normalizePath(folder), selectedType)
  );

  // Get only audio files
  let allFiles = [];
  for (const folder of filePaths) {
    allFiles.push(...getFilesRecursively(folder, audioExts, []));
  }

  let processed = 0;
  const total = allFiles.length;

  for (const file of allFiles) {
    const ext = path.extname(file).toLowerCase();
    if (!audioExts.includes(ext)) continue;

    if (!cachedSongs.has(normalizePath(file))) {
      const songData = await readAudioMetadata(file);
      /* insertSong(songData);
      cachedSongs.add(normalizePath(file)); */
      songData.filePath = normalizePath(songData.filePath);
      insertSong(songData);
      cachedSongs.add(songData.filePath);
    }

    processed++;
    sendProgress(win, processed, total);
  }

  await refreshLibraryFolders();
});

ipcMain.handle('add-video-folders', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);

  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select Video Folder(s)',
    properties: ['openDirectory', 'multiSelections']
  });

  if (canceled || !filePaths.length) return;

  const selectedType = "video";
  const insertFolder = db.prepare(`
    INSERT OR IGNORE INTO LibraryFolders (path, type)
    VALUES (?, ?)
  `);

  //filePaths.forEach(folder => insertFolder.run(folder, selectedType));
  filePaths.forEach(folder =>
    insertFolder.run(normalizePath(folder), selectedType)
  );

  // Get only video files
  let allFiles = [];
  for (const folder of filePaths) {
    allFiles.push(...getFilesRecursively(folder, [], videoExts));
  }

  let processed = 0;
  const total = allFiles.length;

  for (const file of allFiles) {
    const ext = path.extname(file).toLowerCase();
    if (!videoExts.includes(ext)) continue;

    if (!cachedVideos.has(normalizePath(file))) {
      const stats = fs.statSync(file);
      const thumb = extractVideoThumbnail(file);
      const duration = getVideoDuration(file);

      const norm = normalizePath(file);

      insertVideo({
        filePath: norm,
        title: path.basename(file),
        thumbnail: thumb,
        duration,
        fileSize: stats.size
      });

      cachedVideos.add(normalizePath(file));
    }

    processed++;
    sendProgress(win, processed, total);
  }

  await refreshLibraryFolders();
  //win.webContents.send('folders-updated');
});

function formatDuration(seconds) {
  seconds = Math.floor(seconds); // ignore fractions for display

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  let parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);

  return parts.join(" ");
}

function cleanPath(p) {
  // Decode if it ever passed through URL land, then normalize
  try {
    return path.normalize(decodeURIComponent(p));
  } 
  catch {
    return path.normalize(p);
  }
}
/* 
ipcMain.handle('remove-folder', async (event, folderPath) => {
  try {
    const normalized = normalizePath(folderPath).replace(/\/+$/, '');
    const prefix = normalized + '/';

    // 1. Delete songs from that folder
    db.prepare(`
      DELETE FROM Songs
      WHERE filePath LIKE ?
    `).run(prefix + '%');

    // 2. Delete videos from that folder
    db.prepare(`
      DELETE FROM Videos
      WHERE filePath LIKE ?
    `).run(prefix + '%');

    // 3. Remove folder record
    db.prepare(`
      DELETE FROM LibraryFolders
      WHERE path = ?
    `).run(normalized);

    // 4. Cleanup orphan Albums
    db.prepare(`
      DELETE FROM Albums
      WHERE id NOT IN (
        SELECT DISTINCT albumID FROM Songs WHERE albumID IS NOT NULL
      );
    `).run();

    // 5. Cleanup orphan Artists
    db.prepare(`
      DELETE FROM Artists
      WHERE id NOT IN (
        SELECT DISTINCT artistID FROM Songs WHERE artistID IS NOT NULL
      );
    `).run();

    // 6. Cleanup orphan Genres
    db.prepare(`
      DELETE FROM Genres
      WHERE id NOT IN (
        SELECT DISTINCT genreID FROM Songs WHERE genreID IS NOT NULL
      );
    `).run();

    // 7. Refresh UI
    await refreshLibraryFolders();

    sendToWin('toast', {
      type: 'info',
      message: `Stopped watching and removed media from: ${normalized}`
    });

    return { ok: true };
  } 
  catch (err) {
    console.error('Failed to remove folder:', err);
    sendToWin('toast', { type: 'error', message: `Error removing folder` });
    return { ok: false, error: err.message };
  }
}); */
/* 
ipcMain.handle('remove-folder', async (event, folderPath) => {
  try {
    const normalized = normalizePath(folderPath).replace(/\/+$/, '');
    const prefix = normalized + '/';

    // --- Remove cached songs/videos first ---
    const songRows = db.prepare(`
      SELECT filePath FROM Songs
      WHERE filePath LIKE ?
    `).all(prefix + '%');

    const videoRows = db.prepare(`
      SELECT filePath FROM Videos
      WHERE filePath LIKE ?
    `).all(prefix + '%');

    for (const row of songRows) {
      cachedSongs.delete(normalizePath(row.filePath));
    }

    for (const row of videoRows) {
      cachedVideos.delete(normalizePath(row.filePath));
    }

    // --- Then delete from DB ---
    db.prepare(`DELETE FROM Songs WHERE filePath LIKE ?`).run(prefix + '%');
    db.prepare(`DELETE FROM Videos WHERE filePath LIKE ?`).run(prefix + '%');
    db.prepare(`DELETE FROM LibraryFolders WHERE path = ?`).run(normalized);

    // --- Remove orphan albums/artists/genres (your cleanup) ---
    db.prepare(`DELETE FROM Albums WHERE id NOT IN (SELECT DISTINCT albumID FROM Songs WHERE albumID IS NOT NULL)`).run();
    db.prepare(`DELETE FROM Artists WHERE id NOT IN (SELECT DISTINCT artistID FROM Songs WHERE artistID IS NOT NULL)`).run();
    db.prepare(`DELETE FROM Genres WHERE id NOT IN (SELECT DISTINCT genreID FROM Songs WHERE genreID IS NOT NULL)`).run();

    await refreshLibraryFolders();

    sendToWin('toast', {
      type: 'info',
      message: `Stopped watching and removed media from: ${normalized}`
    });

    return { ok: true };
  }
  catch (err) {
    console.error('Failed to remove folder:', err);
    sendToWin('toast', { type: 'error', message: `Error removing folder` });
    return { ok: false, error: err.message };
  }
}); */

ipcMain.handle('remove-folder', async (event, folderPath) => {
  try {
    const normalized = normalizePath(folderPath).replace(/\/+$/, '');
    const prefix = normalized + '/';

    // 1. Collect existing song/video paths BEFORE deleting from DB
    const songsToRemove = db.prepare(`
      SELECT filePath FROM Songs
      WHERE filePath LIKE ?
    `).all(prefix + '%');

    const videosToRemove = db.prepare(`
      SELECT filePath FROM Videos
      WHERE filePath LIKE ?
    `).all(prefix + '%');

    // 2. Remove matching file paths from in-memory caches
    for (const r of songsToRemove) {
      cachedSongs.delete(normalizePath(r.filePath));
    }

    for (const r of videosToRemove) {
      cachedVideos.delete(normalizePath(r.filePath));
    }

    // 3. Remove songs & videos from DB
    db.prepare(`
      DELETE FROM Songs
      WHERE filePath LIKE ?
    `).run(prefix + '%');

    db.prepare(`
      DELETE FROM Videos
      WHERE filePath LIKE ?
    `).run(prefix + '%');

    // 4. Remove the folder record
    db.prepare(`
      DELETE FROM LibraryFolders
      WHERE path = ?
    `).run(normalized);

    // 5. Delete orphan Albums
    db.prepare(`
      DELETE FROM Albums
      WHERE id NOT IN (
        SELECT DISTINCT albumID
        FROM Songs
        WHERE albumID IS NOT NULL
      );
    `).run();

    // 6. Delete orphan Artists
    db.prepare(`
      DELETE FROM Artists
      WHERE id NOT IN (
        SELECT DISTINCT artistID
        FROM Songs
        WHERE artistID IS NOT NULL
      );
    `).run();

    // 7. Delete orphan Genres
    db.prepare(`
      DELETE FROM Genres
      WHERE id NOT IN (
        SELECT DISTINCT genreID
        FROM Songs
        WHERE genreID IS NOT NULL
      );
    `).run();

    // 8. Refresh UI + watchers
    await refreshLibraryFolders();

    // 9. Rebuild the cache from DB for absolute consistency
    rebuildCachesFromDatabase();

    // 10. Notify frontend
    sendToWin('toast', {
      type: 'info',
      message: `Stopped watching and removed media from: ${normalized}`
    });

    return { ok: true };
  }
  catch (err) {
    console.error('Failed to remove folder:', err);
    sendToWin('toast', {
      type: 'error',
      message: `Error removing folder`
    });
    return { ok: false, error: err.message };
  }
});


ipcMain.handle('reload-folders', async (event) => {
  try {
    sendToWin('toast', { type: 'info', message: 'Reloading watch folders...' });

    // Reload folders from DB
    const foldersFromDB = db.prepare("SELECT path FROM LibraryFolders").all().map(r => normalizePath(r.path));
    
    // Update global watchFolders variable
    watchFolders = foldersFromDB;

    // (Optional) Restart your watcher here with updated folders
    //restartWatcherWithFolders(watchFolders);

    sendToWin('toast', { type: 'ok', message: 'Reload complete.' });
    return { ok: true, folders: watchFolders };

  } 
  catch (err) {
    console.error('reload-folders error:', err);
    sendToWin('toast', { type: 'error', message: 'Reload failed' });
    return { ok: false, err: err.message };
  }
});

ipcMain.handle('full-folder-rescan', async () => {
  try {
    sendToWin('toast', { type: 'info', message: 'Scanning folders for new songs and videos...' });

    // Get folders along with their declared type
    const watchRows = db.prepare("SELECT path, type FROM LibraryFolders").all();
    const watchFolders = watchRows.map(r => ({
      path: normalizePath(r.path),
      dbPath: r.path,   // original form if needed
      type: (r.type || 'mixed')
    }));

    let newSongsCount = 0;
    let newVideosCount = 0;

    for (const wf of watchFolders) {
      const folder = wf.path;
      const folderType = wf.type; // 'audio' | 'video' | 'mixed'

      // Walk files inside this particular watch folder
      for await (const file of walkFiles(folder)) {
        try {
          const norm = normalizePath(file);
          const ext = path.extname(norm).toLowerCase();

          // Determine whether this folder should accept audio/video
          const acceptsAudio = folderType === 'audio' || folderType === 'mixed';
          const acceptsVideo = folderType === 'video' || folderType === 'mixed';

          // If file is audio but folder doesn't accept audio -> skip
          if (isAudioFile(norm) && !acceptsAudio) continue;

          // If file is video but folder doesn't accept video -> skip
          if (isVideoFile(norm) && !acceptsVideo) continue;

          // === AUDIO ===
          if (isAudioFile(norm)) {
            if (cachedSongs.has(norm)) continue;

            const existsSong = db
              .prepare('SELECT 1 FROM Songs WHERE filePath = ?')
              .get(norm);

            if (existsSong) {
              cachedSongs.add(norm);
              continue;
            }

            const data = await readAudioMetadata(file);
            data.filePath = norm;

            insertSong(data);
            cachedSongs.add(norm);
            newSongsCount++;
          }
          // === VIDEO ===
          else if (isVideoFile(norm)) {
            if (cachedVideos.has(norm)) continue;

            const existsVideo = db
              .prepare('SELECT 1 FROM Videos WHERE filePath = ?')
              .get(norm);

            if (existsVideo) {
              cachedVideos.add(norm);
              continue;
            }

            const stats = fs.statSync(file);
            const thumb = extractVideoThumbnail(file);
            const duration = getVideoDuration(file);

            insertVideo({
              filePath: norm,
              title: path.basename(file),
              thumbnail: thumb,
              duration,
              fileSize: stats.size
            });

            cachedVideos.add(norm);
            newVideosCount++;
          }
        } catch (fileErr) {
          // Don't crash full rescan for one bad file — warn and continue
          console.warn("Error processing file during full rescan:", file, fileErr);
          continue;
        }
      } // end for await walkFiles
    } // end for each watch folder

    const totalNew = newSongsCount + newVideosCount;

    sendToWin('toast', {
      type: totalNew ? 'ok' : 'info',
      message: totalNew
        ? `Added ${newSongsCount} new songs and ${newVideosCount} new videos`
        : 'No new songs or videos found.'
    });

    return { ok: true, addedSongs: newSongsCount, addedVideos: newVideosCount };
  } 
  catch (err) {
    console.error('Full folder rescan failed:', err);
    sendToWin('toast', { type: 'error', message: 'Rescan failed' });
    return { ok: false, err: err.message };
  }
});


function isAudioFile(file) {
  return /\.(mp3|flac|aac|m4a|ogg|wav)$/i.test(file);
}
function isVideoFile(f) {
  return /\.(mp4|mkv|webm|mov|m4v)$/i.test(f);
}
async function* walkFiles(dir) {
  const items = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) yield* walkFiles(full);
    else yield full;
  }
}

function sendProgress(win, processed, total) {
  win.webContents.send("import-progress", { processed, total });
}

// Return all songs from the database

ipcMain.handle('get-songs', () => {
  const rows = db.prepare(`
    SELECT 
      s.id,
      s.filePath,
      s.fileName,
      s.extension,
      s.fileSize,
      s.createdDate,
      s.modifiedDate,
      s.title,
      s.artistID,
      ar.name AS artist,
      s.albumID,
      a.name AS albumName,
      a.albumArt AS albumArt,
      s.genreID,
      g.name AS genre,
      s.duration,
      s.year,
      s.isFavorite,
      s.playCounter,
      s.lastTimePlayed,
      s.addedDate
    FROM Songs s
    LEFT JOIN Albums a ON s.albumID = a.id
    LEFT JOIN Artists ar ON s.artistID = ar.id
    LEFT JOIN Genres g ON s.genreID = g.id
    WHERE s.filePath IS NOT NULL
  `).all();

  return rows;
});

/*  ORDER BY s.title COLLATE NOCASE; */

ipcMain.handle('get-song-by-id', (event, songId) => {
  const song = db.prepare(`
    SELECT 
      s.id,
      s.filePath,
      s.fileName,
      s.extension,
      s.fileSize,
      s.createdDate,
      s.modifiedDate,
      s.title,
      s.artistID,
      ar.name AS artist,
      s.albumID,
      a.name AS albumName,
      a.albumArt AS albumArt,
      s.genreID,
      g.name AS genre,
      s.duration,
      s.year,
      s.isFavorite,
      s.playCounter,
      s.lastTimePlayed,
      s.addedDate
    FROM Songs s
    LEFT JOIN Albums a ON s.albumID = a.id
    LEFT JOIN Artists ar ON s.artistID = ar.id
    LEFT JOIN Genres g ON s.genreID = g.id
    WHERE s.id = ?;
  `).get(songId);

  return song;
});

ipcMain.handle('get-song-buffer', async (event, filePath) => {
  const buffer = await fs.promises.readFile(filePath);
  return buffer; // Node Buffer
});

loadCachedLibrary();

let recentlyDeleted = new Map(); // { oldPath: timestamp }
const RENAME_WINDOW = 2000; // ms

function startWatcher() {
  // Do not start watcher if disabled or sync is running
  if (!syncWatchEnabled) {
    console.log("-> Sync/Watch disabled. Watcher will NOT start.");

    if (watcher) {
      watcher.close().catch(() => {});
      watcher = null;
      console.log("-> Existing watcher stopped.");
    }
    return;
  }

  if (isSyncRunning) {
    console.log("-> Sync in progress. Watcher start deferred.");
    return;
  }

  // Stop any existing watcher before starting a new one
  if (watcher) {
    watcher.close().catch(() => {});
    watcher = null;
  }

  if (!watchFolders || watchFolders.length === 0) {
    console.log("-> No watch folders defined.");
    return;
  }

  watcher = chokidar.watch(watchFolders, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  });

  watcher.on('add', file => {
    if (suppressWatcherEvents || isSyncRunning) return;
    onFileAdded(normalizePath(file));
  });

  watcher.on('change', file => {
    if (suppressWatcherEvents || isSyncRunning) return;
    onFileChanged(normalizePath(file));
  });

  watcher.on('unlink', file => {
    if (suppressWatcherEvents || isSyncRunning) return;
    onFileRemoved(normalizePath(file));
  });

  console.log("-> startWatcher: Watching folders:", watchFolders);
}



async function onFileChanged(file) {
  const ext = path.extname(file).toLowerCase();

  // SONG UPDATED
  if (audioExts.includes(ext) && cachedSongs.has(normalizePath(file))) {
    console.log("-> File modified:", file);

    const data = await readAudioMetadata(file);

    const artistID = getOrCreateArtistId(data.artist);
    const genreID = getOrCreateGenreId(data.genres);

    db.prepare(`
      UPDATE Songs SET
        fileName   = @fileName,
        extension  = @extension,
        fileSize   = @fileSize,
        modifiedDate = @modifiedDate,
        title      = @title,
        artist     = @artist,
        artistID   = @artistID,
        albumID    = @albumID,
        duration   = @duration,
        genres     = @genres,
        genreID    = @genreID,
        year       = @year
      WHERE filePath = @filePath
    `).run({ ...data, artistID, genreID });

    console.log("-> Updated song metadata:", file);
    return;
  }

  // VIDEO UPDATED
  if (videoExts.includes(ext) && cachedVideos.has(normalizePath(file))) {
    console.log("-> Video modified:", file);

    const thumb = extractVideoThumbnail(file);
    const duration = getVideoDuration(file);

    db.prepare(`
      UPDATE Videos SET
        thumbnail = ?,
        duration  = ?
      WHERE filePath = ?
    `).run(thumb, duration, file);

    console.log("-> Updated video metadata:", file);
    return;
  }
}

function onFileRemoved(file) {
  const timestamp = Date.now();
  const normalized = normalizePath(file);
  recentlyDeleted.set(normalized, timestamp);

  setTimeout(() => {
    if (recentlyDeleted.get(normalized) !== timestamp) return;
    recentlyDeleted.delete(normalized);

    if (cachedSongs.has(normalized)) {
      cachedSongs.delete(normalized);

      const song = db.prepare(`
        SELECT id, title FROM Songs 
        WHERE LOWER(filePath) = LOWER(?)
      `).get(file);

      db.prepare(`
        DELETE FROM Songs 
        WHERE LOWER(filePath) = LOWER(?)
      `).run(file);

      if (song) {
        const win = BrowserWindow.getAllWindows()[0];
        win?.webContents.send('file-removed', {
          songId: song.id,
          fileName: song.title
        });
      }
      console.log("-> Removed song from DB:", file);
    }

    if (cachedVideos.has(normalized)) {
      cachedVideos.delete(normalized);
      db.prepare(`
        DELETE FROM Videos WHERE LOWER(filePath) = LOWER(?)
      `).run(file);
      console.log("-> Removed video from DB:", file);
    }
  }, RENAME_WINDOW);
}

async function onFileAdded(file) {
  const ext = path.extname(file).toLowerCase();
  const normNew = normalizePath(file);

  // ---------- RENAME / MOVE DETECTION ----------
  for (const [oldPath, ts] of recentlyDeleted.entries()) {
    const normOld = normalizePath(oldPath);

    if (
      Date.now() - ts < RENAME_WINDOW &&
      path.extname(normOld).toLowerCase() === ext
    ) {
      console.log(`-> Rename detected:\n${oldPath} → ${file}`);

      const newFileName = path.basename(file);
      const newTitle = path.basename(file, ext);

      const songRow = db
        .prepare(`SELECT id FROM Songs WHERE filePath = ?`)
        .get(normOld);

      const videoRow = db
        .prepare(`SELECT id FROM Videos WHERE filePath = ?`)
        .get(normOld);

      if (songRow) {
        db.prepare(`
          UPDATE Songs
          SET filePath = ?, fileName = ?, title = ?
          WHERE filePath = ?
        `).run(normNew, newFileName, newTitle, normOld);
      }

      if (videoRow) {
        db.prepare(`
          UPDATE Videos
          SET filePath = ?, title = ?
          WHERE filePath = ?
        `).run(normNew, newFileName, normOld);
      }

      // ---- Cache cleanup ----
      recentlyDeleted.delete(normOld);
      cachedSongs.delete(normOld);
      cachedVideos.delete(normOld);
      cachedSongs.add(normNew);
      cachedVideos.add(normNew);

      const win = BrowserWindow.getAllWindows()[0];
      win?.webContents.send('file-renamed', {
        oldPath,
        newPath: file,
        newFileName,
        newTitle,
        songId: songRow?.id ?? null,
        videoId: videoRow?.id ?? null
      });

      return; // IMPORTANT: stop here, do NOT fall through
    }
  }

  // ---------- NORMAL ADD (AUDIO) ----------
  if (audioExts.includes(ext)) {
    if (cachedSongs.has(normNew)) return;

    const exists = db
      .prepare(`SELECT 1 FROM Songs WHERE filePath = ?`)
      .get(normNew);

    if (exists) {
      cachedSongs.add(normNew);
      return;
    }

    const data = await readAudioMetadata(file);
    data.filePath = normNew;

    const id = insertSong(data);
    cachedSongs.add(normNew);

    console.log("-> Auto-added song:", file);

    if (id) {
      data.id = id;
      const win = BrowserWindow.getAllWindows()[0];
      win?.webContents.send("song-added", {
        file,
        fileName: path.basename(file),
        song: data
      });
    }

    return;
  }

  // ---------- NORMAL ADD (VIDEO) ----------
  if (videoExts.includes(ext)) {
    if (cachedVideos.has(normNew)) return;

    const exists = db
      .prepare(`SELECT 1 FROM Videos WHERE filePath = ?`)
      .get(normNew);

    if (exists) {
      cachedVideos.add(normNew);
      return;
    }

    const stats = fs.statSync(file);
    const thumb = extractVideoThumbnail(file);
    const duration = getVideoDuration(file);

    insertVideo({
      filePath: normNew,
      title: path.basename(file),
      thumbnail: thumb,
      duration,
      fileSize: stats.size
    });

    cachedVideos.add(normNew);
    console.log("-> Auto-added video:", file);

    const win = BrowserWindow.getAllWindows()[0];
    win?.webContents.send("video-added", {
      file,
      fileName: path.basename(file)
    });
  }
}

async function refreshLibraryFolders() {
  await loadWatchFolders();
}

async function loadWatchFolders() {
  const rows = db.prepare("SELECT path FROM LibraryFolders").all();
  watchFolders = rows.map(r => normalizePath(r.path));

  console.log("-> loadWatchFolders: Watch folders loaded:", watchFolders);

  if (!syncWatchEnabled) {
    console.log("-> Sync/Watch is DISABLED");
    if (watcher) {
      watcher.close().catch(() => {});
      watcher = null;
      console.log("-> Watcher stopped.");
    }
    return;
  }

  console.log("-> Sync/Watch is ENABLED");

  // Stop watcher BEFORE syncing
  if (watcher) {
    watcher.close().catch(() => {});
    watcher = null;
  }

  if (isSyncRunning) {
    console.log("-> Sync already running, skipping");
    return;
  }

  isSyncRunning = true;
  suppressWatcherEvents = true;

  try {
    await syncLibrarySongs(db);
  } 
  finally {
    suppressWatcherEvents = false;
    isSyncRunning = false;
  }

  startWatcher();
}

/* ------------------------------------------------------------- */

function sendToWin(eventName, payload) {
  try {
    const w = BrowserWindow.getAllWindows()[0];
    if (w && w.webContents) w.webContents.send(eventName, payload);
  } catch (err) {
    console.error('sendToWin err', err);
  }
}

function sendIndexProgress(processed, total, message = '') {
  sendToWin('index-progress', { processed, total, message });
}

ipcMain.handle('get-watch-folders', () => {
  const rows = db.prepare("SELECT id, path, type, addedAt FROM LibraryFolders").all();
  return rows;
});

ipcMain.handle("get-folder-stats", async (event, folderPath) => {
  let subfolderCount = 0;

  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    subfolderCount = entries.filter(e => e.isDirectory()).length;
  } catch {
    subfolderCount = 0;
  }

  // IMPORTANT: normalize folder path exactly like DB
  const normFolder = normalizePath(folderPath);

  // Get folder type
  const folderRow = db.prepare(`
    SELECT type FROM LibraryFolders WHERE path = ?
  `).get(folderPath);

  // ---- SONGS ----
  const songStats = db.prepare(`
    SELECT 
      COUNT(*) AS total,
      IFNULL(SUM(fileSize), 0) AS totalBytes
    FROM Songs
    WHERE filePath LIKE ?
  `).get(normFolder + "/%");

  // ---- VIDEOS ----
  const videoStats = db.prepare(`
    SELECT 
      COUNT(*) AS total,
      IFNULL(SUM(fileSize), 0) AS totalBytes
    FROM Videos
    WHERE filePath LIKE ?
  `).get(normFolder + "/%");

  return {
    subfolderCount,
    songCount: (songStats.total || 0) + (videoStats.total || 0),
    totalBytes: (songStats.totalBytes || 0) + (videoStats.totalBytes || 0),
    type: folderRow?.type || "mixed"
  };
});

ipcMain.handle("open-folder", async (event, folder) => {
  const { shell } = require("electron");
  shell.openPath(folder);
});

ipcMain.handle("get-subfolders", async (event, dir) => {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => path.join(dir, e.name));
  } 
  catch {
    return [];
  }
});

ipcMain.handle('cleanup-missing-media', () => {
  const delSongs = db.prepare(`DELETE FROM Songs WHERE filePath IS NULL`);
  const delVideos = db.prepare(`DELETE FROM Videos WHERE filePath IS NULL`);
  delSongs.run();
  delVideos.run();
  return { ok: true };
});

ipcMain.handle('setSongFavorite', (event, id, fav) => {
  try {
    // Normalize fav to 0/1 (handles boolean, number, string)
    const favNum = fav ? 1 : 0;
    const now = Date.now();

    // Use SQL CASE so favDate is set by the DB atomically
    const stmt = db.prepare(`
      UPDATE Songs
      SET
        isFavorite = @fav,
        favDate = CASE WHEN @fav = 1 THEN @now ELSE NULL END
      WHERE id = @id
    `);

    const result = stmt.run({ fav: favNum, now, id });

    if (result.changes > 0) {
      // return the row so caller can verify favDate
      const row = db.prepare(`
        SELECT id, isFavorite, favDate, title FROM Songs WHERE id = ?
      `).get(id);

      return { success: true, row };
    } 
    else {
      return { success: false, error: 'Song not found or no change' };
    }
  } 
  catch (err) {
    return { success: false, error: err.message };
  }
});

/* 
ipcMain.handle('delete-song', async (event, songId) => {
  try {
    const row = db.prepare('SELECT filePath FROM Songs WHERE id = ?').get(songId);
    if (!row) return { success: false, error: 'Song not found' };

    const filePath = row.filePath;
    if (!filePath) {
      // still remove DB row if path missing
      db.prepare('DELETE FROM Songs WHERE id = ?').run(songId);
      return { success: true, removedFromCache: false };
    }

    const norm = normalizePath(filePath);

    // Delete DB row
    db.prepare('DELETE FROM Songs WHERE id = ?').run(songId);

    // Remove from cachedSongs set (and cachedVideos if you track videos similarly)
    // cachedSongs likely stores normalized paths as well — try to remove both raw and normalized to be safe
    cachedSongs.delete(filePath);
    cachedSongs.delete(norm);

    cachedVideos.delete(filePath);
    cachedVideos.delete(norm);

    // recentlyDeleted cleanup if present
    if (typeof recentlyDeleted !== 'undefined') {
      recentlyDeleted.delete(filePath);
      recentlyDeleted.delete(norm);
    }

    console.log('-> Deleted from DB and removed from caches:', filePath);
    return { success: true, removedFromCache: true, filePath };
  } 
  catch (err) {
    console.error('Failed to delete song:', err);
    return { success: false, error: err.message };
  }
}); */

ipcMain.handle('delete-song', async (event, songId) => {
  try {
    const row = db.prepare(`SELECT filePath, albumID, artistID, genreID 
                            FROM Songs WHERE id = ?`).get(songId);

    if (!row) return { success: false, error: "Song not found" };

    const norm = normalizePath(row.filePath);

    // Delete from DB (Songs + Playlists relations)
    db.prepare(`DELETE FROM PlaylistSongs WHERE songID = ?`).run(songId);
    db.prepare(`DELETE FROM Songs WHERE id = ?`).run(songId);

    // Remove from cache
    cachedSongs.delete(norm);

    // Cleanup orphan Albums, Artists, Genres
    db.prepare(`
      DELETE FROM Albums WHERE id NOT IN (
        SELECT DISTINCT albumID FROM Songs WHERE albumID IS NOT NULL
      )
    `).run();

    db.prepare(`
      DELETE FROM Artists WHERE id NOT IN (
        SELECT DISTINCT artistID FROM Songs WHERE artistID IS NOT NULL
      )
    `).run();

    db.prepare(`
      DELETE FROM Genres WHERE id NOT IN (
        SELECT DISTINCT genreID FROM Songs WHERE genreID IS NOT NULL
      )
    `).run();

    // Rebuild cache for complete consistency
    rebuildCachesFromDatabase();

    return { success: true, filePath: norm };
  }
  catch (err) {
    console.error("delete-song error:", err);
    return { success: false, error: err.message };
  }
});


/* 
ipcMain.handle('delete-video', async (event, videoId) => {
  try {
    const row = db.prepare('SELECT filePath FROM Videos WHERE id = ?').get(videoId);
    if (!row) return { success: false, error: 'Video not found' };

    const filePath = row.filePath;
    if (!filePath) {
      // Remove DB row when file path missing
      db.prepare('DELETE FROM Videos WHERE id = ?').run(videoId);
      return { success: true, removedFromCache: false };
    }

    const norm = normalizePath(filePath);

    // Delete from DB
    db.prepare('DELETE FROM Videos WHERE id = ?').run(videoId);

    // Cache cleanup (if you track videos separately)
    // Try removing both raw + normalized path
    if (typeof cachedVideos !== 'undefined') {
      cachedVideos.delete(filePath);
      cachedVideos.delete(norm);
    }

    // In case songs and videos share any scanner cache
    if (typeof cachedSongs !== 'undefined') {
      cachedSongs.delete(filePath);
      cachedSongs.delete(norm);
    }

    // recentlyDeleted cleanup if you have it
    if (typeof recentlyDeleted !== 'undefined') {
      recentlyDeleted.delete(filePath);
      recentlyDeleted.delete(norm);
    }

    console.log('-> Deleted video from DB and removed from caches:', filePath);
    return { success: true, removedFromCache: true, filePath };
  }
  catch (err) {
    console.error('Failed to delete video:', err);
    return { success: false, error: err.message };
  }
}); */

ipcMain.handle('delete-video', async (event, videoId) => {
  try {
    const row = db.prepare(`SELECT filePath FROM Videos WHERE id = ?`).get(videoId);

    if (!row) return { success: false, error: "Video not found" };

    const norm = normalizePath(row.filePath);

    // Delete row from DB
    db.prepare(`DELETE FROM Videos WHERE id = ?`).run(videoId);

    // Remove from cache
    cachedVideos.delete(norm);

    // Rebuild cache for clean state
    rebuildCachesFromDatabase();

    return { success: true, filePath: norm };
  }
  catch (err) {
    console.error("delete-video error:", err);
    return { success: false, error: err.message };
  }
});

//----------------------------LIBARY SYNC ON START--------------------------

// --- Recursive scan ---
function scanDir(directory) {
  let results = [];

  try {
    const items = fs.readdirSync(directory, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(directory, item.name);
      if (item.isDirectory()) {
        results = results.concat(scanDir(fullPath));
      } 
      else {
        results.push(fullPath);
      }
    }
  } 
  catch (err) {
    console.warn(`! Cannot read folder: ${directory}`, err);
  }

  return results;
}

// -------- SYNC MODIFICATIONS MADE WHILE APP WAS NOT OPEN --------
function isInsideLibraryFolders(filePath, folders) {
  const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');
  return folders.some(folder => {
    const normalizedFolder = folder.path.toLowerCase().replace(/\\/g, '/');
    return normalizedPath.startsWith(normalizedFolder);
  });
}

async function syncLibrarySongs(db) {
  console.log("-> Starting library sync...");

  // 1️⃣ Get library folders from DB
  const folders = db.prepare(`SELECT path FROM LibraryFolders`).all();

  if (!folders.length) {
    console.log("-> No library folders, skipping sync");
    return;
  }

  // 2️⃣ Scan disk
  let diskFiles = [];

  for (const row of folders) {
    diskFiles = diskFiles.concat(scanDir(row.path));
  }

  // Filter only audio files
  diskFiles = diskFiles.filter(f =>
    audioExts.includes(path.extname(f).toLowerCase())
  );

  //const diskSet = new Set(diskFiles.map(f => f.toLowerCase()));
  const diskSet = new Set(diskFiles.map(f => normalizePath(f)));

  // 3️⃣ Get existing songs from DB
  const dbSongs = db.prepare(`SELECT id, filePath FROM Songs`).all();
  //const dbSet = new Set(dbSongs.map(r => r.filePath.toLowerCase()));
  const dbSet = new Set(dbSongs.map(r => normalizePath(r.filePath)));

  const win = BrowserWindow.getAllWindows()[0];

  // 4️⃣ Add new or updated files
  for (const file of diskSet) {
    const lower = file.toLowerCase();
    const dbEntry = dbSongs.find(r => r.filePath.toLowerCase() === lower);

    const stats = fs.statSync(file);
    const mtime = Math.floor(stats.mtimeMs);

    // FILE NOT IN DB → ADD NEW SONG
    if (!dbEntry) {
      console.log("-> Adding missing file:", file);

      const data = await readAudioMetadata(file);
      data.modifiedDate = mtime; // store actual file mtime

      const artistID = getOrCreateArtistId(data.artist);
      const genreID = getOrCreateGenreId(data.genres);

      const stmt = db.prepare(`
        INSERT OR IGNORE INTO Songs (
          filePath, fileName, extension, fileSize,
          createdDate, modifiedDate, title, artist,
          artistID, albumID, duration, genres, genreID, year,
          addedDate
        )
        VALUES (
          @filePath, @fileName, @extension, @fileSize,
          @createdDate, @modifiedDate, @title, @artist,
          @artistID, @albumID, @duration, @genres, @genreID, @year,
          @addedDate
        )
      `);

      const info = stmt.run({ ...data, artistID, genreID });

      const newId = info.lastInsertRowid;

      win?.webContents.send("song-added", {
        id: newId,
        file,
        fileName: path.basename(file)
      });

      continue;
    }

    // FILE EXISTS BUT MODIFIED → UPDATE METADATA
    const dbInfo = db.prepare(`SELECT modifiedDate FROM Songs WHERE id = ?`).get(dbEntry.id);

    if (dbInfo && mtime > dbInfo.modifiedDate) {
      console.log("-> File modified:", file);

      const data = await readAudioMetadata(file);
      data.modifiedDate = mtime;
      data.id = dbEntry.id;

      const normalized = normalizePath(file);
      data.filePath = normalized;

      //data.filePath = file;

      const artistID = getOrCreateArtistId(data.artist);
      const genreID = getOrCreateGenreId(data.genres);

      db.prepare(`
        UPDATE Songs SET
          fileName     = @fileName,
          extension    = @extension,
          fileSize     = @fileSize,
          modifiedDate = @modifiedDate,
          title        = @title,
          artist       = @artist,
          artistID     = @artistID,
          albumID      = @albumID,
          duration     = @duration,
          genres       = @genres,
          genreID      = @genreID,
          year         = @year
        WHERE id = @id
      `).run({ ...data, artistID, genreID });

      console.log("-> Updated song metadata:", file);

      win?.webContents.send("song-updated", {
        id: dbEntry.id,
        file,
        fileName: path.basename(file)
      });

      continue;
    }
  }

  for (const row of dbSongs) {
    const filePathLower = row.filePath.toLowerCase();

    // Check if song file physically exists on disk
    const fileExists = fs.existsSync(row.filePath);

    // Check if song is inside watched folders
    const insideFolder = isInsideLibraryFolders(row.filePath, folders);

    if (!fileExists) {
      // File doesn't exist anywhere on disk — delete from DB
      console.log("-> Removing missing file (file not found on disk):", row.filePath);

      db.prepare(`DELETE FROM Songs WHERE id = ?`).run(row.id);

      if (win) {
        win.webContents.send("file-removed", {
          songId: row.id,
          fileName: path.basename(row.filePath)
        });
      }
    }
    else if (insideFolder && !diskSet.has(filePathLower)) {
      // File exists on disk but not found inside watched folders scan (maybe moved or deleted inside folder)
      console.log("-> Removing missing file (missing from library folders scan):", row.filePath);

      db.prepare(`DELETE FROM Songs WHERE id = ?`).run(row.id);

      if (win) {
        win.webContents.send("file-removed", {
          songId: row.id,
          fileName: path.basename(row.filePath)
        });
      }
    }
    // Else: file exists and is either outside library folders or correctly inside → keep it
  }


  console.log("-> Library sync complete.");
}

/* VIDEOS */

// ============ GET VIDEOS ============

ipcMain.handle("get-videos", () => {
  try {
    const stmt = db.prepare(`
      SELECT 
        id,
        filePath,
        title,
        thumbnail,
        duration,
        addedAt
      FROM Videos
    `);

    return stmt.all();
  } 
  catch (err) {
    console.error("getVideos error:", err);
    return [];
  }
});

/* ipcMain.handle("get-video-file-info", async (event, filePath) => {
  try {
    return ffprobeGetVideoInfo(filePath);
  } 
  catch (err) {
    console.error("get-video-file-info error:", err);
    return null;
  }
}); */
ipcMain.handle("get-video-file-info", async (event, filePath) => {
  try {
    const row = db.prepare("SELECT thumbnail FROM Videos WHERE filePath = ?").get(filePath);
    const info = ffprobeGetVideoInfo(filePath);

    return {
      ...info,
      thumbnail: row?.thumbnail || null
    };
  } 
  catch (err) {
    console.error("get-video-file-info error:", err);
    return null;
  }
});


function ffprobeGetVideoInfo(filePath) {
  try {
    const cmd = `"${ffprobePath}" -v quiet -print_format json -show_format -show_streams "${filePath}"`;
    const output = child_process.execSync(cmd, { encoding: "utf8" });
    const metadata = JSON.parse(output);

    const videoStream = metadata.streams.find(s => s.codec_type === "video");
    const audioStream = metadata.streams.find(s => s.codec_type === "audio");

    return {
      fileName: path.basename(filePath),
      filePath: filePath,
      fileSize: Number(metadata.format.size),
      duration: Number(metadata.format.duration),
      //createdTime: metadata.format.tags?.creation_time || null,
      createdTime: metadata.format.tags?.creation_time
        ? new Date(metadata.format.tags.creation_time).getTime()
        : fs.statSync(filePath).birthtimeMs,

      modifiedTime: fs.statSync(filePath).mtimeMs,

      width: videoStream?.width || null,
      height: videoStream?.height || null,
      aspect: videoStream?.display_aspect_ratio || null,
/*       fps: videoStream?.r_frame_rate
        ? eval(videoStream.r_frame_rate)
        : null, */
      fps: videoStream?.avg_frame_rate
        ? eval(videoStream.avg_frame_rate)
        : eval(videoStream?.r_frame_rate || "0"),


      videoCodec: videoStream?.codec_name || null,
      videoBitrate: Number(videoStream?.bit_rate) || 0,

      audioCodec: audioStream?.codec_name || null,
      audioBitrate: Number(audioStream?.bit_rate) || 0,
      channels: audioStream?.channels || null,
      sampleRate: Number(audioStream?.sample_rate) || null,
    };
  }
  catch (err) {
    console.error("ffprobeGetVideoInfo error:", err);
    return null;
  }
}


ipcMain.handle("play-video", (event, id) => {
  console.log("Play video ID:", id);

  // Later: actually play the file
  // const video = db.prepare("SELECT filePath FROM Videos WHERE id = ?").get(id);
  // launch video player...

  return true;
});

ipcMain.handle('get-video-by-id', (event, videoId) => {
  const video = db.prepare(`
    SELECT 
      id,
      filePath,
      title,
      thumbnail,
      duration,
      addedAt
    FROM Videos
    WHERE id = ?;
  `).get(videoId);

  return video;
});

ipcMain.handle("show-in-explorer", async (event, songId) => {
  try {
    // Fetch the file path from your DB
    const stmt = db.prepare("SELECT filePath FROM Songs WHERE id = ?");
    const row = stmt.get(songId);

    if (!row || !row.filePath) {
      throw new Error("Song not found");
    }

    const filePath = row.filePath;
    await shell.showItemInFolder(filePath);
    return true;
  } 
  catch (err) {
    console.error("Failed to show item in explorer:", err);
    return false;
  }
});

ipcMain.handle("show-video-in-explorer", async (event, videoId) => {
  try {
    const stmt = db.prepare("SELECT filePath FROM Videos WHERE id = ?");
    const row = stmt.get(videoId);

    if (!row || !row.filePath) {
      throw new Error("Video not found");
    }

    await shell.showItemInFolder(row.filePath);
    return true;
  }
  catch (err) {
    console.error("Failed to show video in explorer:", err);
    return false;
  }
});


// SHOW ALL ARTISTS, GET ALBUMART AND PUT IN ARTISTS WITH SIMILAR NAME BUT DONT HAVE ARTS.
ipcMain.handle('get-artists', () => {
  const artists = db.prepare(`
    SELECT id, name, createdAt
    FROM Artists
  `).all();

  // Normalization helper (only for display)
  const normalizeArtistName = (name) => {
    if (!name) return '';
    let n = name.trim();

    // Move trailing ", The" to front
    if (/, the$/i.test(n)) {
      n = 'The ' + n.replace(/, the$/i, '');
    }

    // Remove noisy suffixes like " - Topic" etc.
    n = n.replace(/\s*-\s*(Topic|Official|Channel|Music|Band)\b/gi, '');

    return n.trim();
  };

  // Build result array preserving original artist ids.
  const result = artists.map(artist => {
    const displayName = normalizeArtistName(artist.name);

    // Try to find album arts by artistID first (more reliable)
    let albums = db.prepare(`
      SELECT albumArt FROM Albums
      WHERE artistID = @artistId
        AND albumArt IS NOT NULL
        AND TRIM(albumArt) <> ''
      LIMIT 4
    `).all({ artistId: artist.id });

    // If none found by artistID, fallback to matching Albums.artist text
    if (!albums || albums.length === 0) {
      albums = db.prepare(`
        SELECT albumArt FROM Albums
        WHERE LOWER(artist) LIKE LOWER(@artistName)
          AND albumArt IS NOT NULL
          AND TRIM(albumArt) <> ''
        LIMIT 4
      `).all({ artistName: `%${displayName}%` });
    }

    return {
      id: artist.id,
      // keep 'name' as the normalized / prettified display name so your UI shows it nicely
      name: displayName || artist.name,
      createdAt: artist.createdAt,
      albumArts: (albums || []).map(a => a.albumArt)
    };
  });

  // Sort by display name (case-insensitive)
  result.sort((a, b) =>
    a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
  );

  return result;
});

ipcMain.handle("get-albums", () => {
  const albums = db.prepare(`
    SELECT 
      Albums.id,
      Albums.name,
      Albums.albumArt,
      Albums.year,
      Albums.createdDate,
      COALESCE(Artists.name, Albums.artist) AS artistName
    FROM Albums
    LEFT JOIN Artists ON Albums.artistID = Artists.id
    ORDER BY LOWER(Albums.name) ASC
  `).all();

  return albums;
});

ipcMain.handle('get-genres', () => {
  const genres = db.prepare(`
    SELECT id, name, createdAt
    FROM Genres
    ORDER BY LOWER(name) ASC
  `).all();

  for (const genre of genres) {
    // --- Get up to 4 albums that belong to this genre ---
    const albums = db.prepare(`
      SELECT DISTINCT a.albumArt
      FROM Albums a
      JOIN Songs s ON s.albumID = a.id
      WHERE 
        (s.genreID = @genreId OR LOWER(s.genres) LIKE LOWER(@genreName))
        AND a.albumArt IS NOT NULL
        AND TRIM(a.albumArt) <> ''
      LIMIT 4
    `).all({
      genreId: genre.id,
      genreName: `%${genre.name}%`
    });

    // Collect valid arts
    genre.albumArts = albums.map(a => a.albumArt);

    // --- Count how many songs belong to this genre ---
    const countRow = db.prepare(`
      SELECT COUNT(*) AS count
      FROM Songs
      WHERE genreID = @genreId OR LOWER(genres) LIKE LOWER(@genreName)
    `).get({
      genreId: genre.id,
      genreName: `%${genre.name}%`
    });

    genre.songCount = countRow.count || 0;
  }

  return genres;
});

ipcMain.handle('getSongsByArtist', (e, artistID) => {
  const artist = db.prepare(`SELECT name FROM Artists WHERE id = ?`).get(artistID);
  const songs = db.prepare(`
    SELECT s.*, a.name AS albumName, a.albumArt
    FROM Songs s
    LEFT JOIN Albums a ON s.albumID = a.id
    WHERE s.artistID = ?
  `).all(artistID);

  return { name: artist ? artist.name : "Unknown Artist", songs };
});

ipcMain.handle('getSongsByAlbum', (e, albumID) => {
  const album = db.prepare(`SELECT name FROM Albums WHERE id = ?`).get(albumID);
  const songs = db.prepare(`
    SELECT s.*, a.name AS albumName, a.albumArt
    FROM Songs s
    LEFT JOIN Albums a ON s.albumID = a.id
    WHERE s.albumID = ?
  `).all(albumID);

  return { name: album ? album.name : "Unknown Album", songs };
});

ipcMain.handle('getSongsByGenre', (e, genreID) => {
  const genre = db.prepare(`SELECT name FROM Genres WHERE id = ?`).get(genreID);
  const songs = db.prepare(`
    SELECT s.*, a.name AS albumName, a.albumArt
    FROM Songs s
    LEFT JOIN Albums a ON s.albumID = a.id
    WHERE s.genreID = ?
  `).all(genreID);

  return { name: genre ? genre.name : "Unknown Genre", songs };
});

//---------------- FAVORITES ----------------

ipcMain.handle('getFavoriteSongs', () => {
  return db.prepare(`
    SELECT s.*, a.name AS albumName, a.albumArt
    FROM Songs s
    LEFT JOIN Albums a ON s.albumID = a.id
    WHERE s.isFavorite = 1
    ORDER BY s.favDate ASC
  `).all();
});

ipcMain.handle('getFavoritesCount', () => {
  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM Songs
    WHERE isFavorite = 1
  `).get();
  return row.count;
});

ipcMain.handle("createPlaylist", (event, name, thumbnail) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO Playlists (name, type, thumbnail)
      VALUES (?, 'custom', ?)
    `);
    const result = stmt.run(name, thumbnail || null);
    return { success: true, id: result.lastInsertRowid };
  } 
  catch (err) {
    console.error("Error creating playlist:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("openFile", async (event, options) => {
  return await dialog.showOpenDialog(options);
});

ipcMain.handle("getAllPlaylists", () => {
  try {
    const rows = db.prepare(`
      SELECT 
        p.id,
        p.name,
        p.thumbnail,
        p.type,
        (
          SELECT COUNT(*)
          FROM PlaylistSongs ps
          WHERE ps.playlistID = p.id
        ) AS count
      FROM Playlists p
      WHERE p.type = 'custom'
      ORDER BY p.createdAt ASC
    `).all();

    return rows;
  } 
  catch (err) {
    console.error("Error loading playlists:", err);
    return [];
  }
});

ipcMain.handle("getPlaylistInfo", (event, playlistId) => {
  try {
    const row = db.prepare(`
      SELECT id, name, thumbnail, type, createdAt
      FROM Playlists
      WHERE id = ?
    `).get(playlistId);

    return row || null;
  } 
  catch (err) {
    console.error("Error getting playlist info:", err);
    return null;
  }
});

ipcMain.handle("getSongsByPlaylist", (event, playlistId) => {
  try {

    // SPECIAL PLAYLIST: Favorites
    if (playlistId == 'favorites') {
      return db.prepare(`
        SELECT 
          s.*,
          a.name AS albumName,
          a.albumArt AS albumArt
        FROM Songs s
        LEFT JOIN Albums a ON a.id = s.albumID
        WHERE s.isFavorite = 1
        ORDER BY s.favDate ASC       -- FIX: oldest first
      `).all();
    }

    // SPECIAL PLAYLIST: History
    if (playlistId == 'history') {
      return db.prepare(`
        SELECT 
          s.*,
          a.name AS albumName,
          a.albumArt AS albumArt
        FROM Songs s
        LEFT JOIN Albums a ON a.id = s.albumID
        WHERE s.lastTimePlayed IS NOT NULL
        ORDER BY s.lastTimePlayed DESC   -- FIX: oldest first
      `).all();
    }

    // NORMAL PLAYLISTS
    return db.prepare(`
      SELECT 
        s.*,
        a.name AS albumName,
        a.albumArt AS albumArt,
        ps.addedDate
      FROM PlaylistSongs ps
      JOIN Songs s ON s.id = ps.songID
      LEFT JOIN Albums a ON a.id = s.albumID
      WHERE ps.playlistID = ?
    `).all(playlistId);

  } catch (err) {
    console.error("Error loading playlist songs:", err);
    return [];
  }
});

ipcMain.handle("import-m3u8-playlist", async (event, m3uPath) => {
  try {
    if (!m3uPath || typeof m3uPath !== "string") {
      throw new Error("Invalid playlist path");
    }

    const playlistDir = path.dirname(m3uPath);

    // Read playlist
    const raw = fs.readFileSync(m3uPath, "utf8");

    const entries = raw
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l =>
        l.length > 0 &&
        !l.startsWith("#") &&
        /\.(mp3|wav|ogg|flac|aac|m4a)$/i.test(l)
      )
      .map(p =>
        path.isAbsolute(p)
          ? normalizePath(p)
          : normalizePath(path.resolve(playlistDir, p))
      );

    if (!entries.length) {
      throw new Error("This playlist contains no valid audio files.");
    }

    // Create playlist
    const playlistName = path.basename(m3uPath).replace(/\.[^.]+$/, "");

    const result = db.prepare(`
      INSERT INTO Playlists (name, type)
      VALUES (?, 'custom')
    `).run(playlistName);

    const playlistID = result.lastInsertRowid;

    let imported = 0;
    let addedToPlaylist = 0;
    let skipped = 0;

    for (const songPath of entries) {
      if (!fs.existsSync(songPath)) {
        skipped++;
        continue;
      }

      let songID;

      const existing = db.prepare(`
        SELECT id FROM Songs WHERE filePath = ?
      `).get(songPath);

      if (existing) {
        songID = existing.id;
      } else {
        try {
          const meta = await readAudioMetadata(songPath);
          meta.filePath = songPath;

          songID = insertSong(meta);
          imported++;
          cachedSongs.add(songPath);
        } catch (err) {
          console.warn("Failed to import song:", songPath, err);
          skipped++;
          continue;
        }
      }

      db.prepare(`
        INSERT OR IGNORE INTO PlaylistSongs (playlistID, songID)
        VALUES (?, ?)
      `).run(playlistID, songID);

      addedToPlaylist++;
    }

    return {
      success: true,
      playlistID,
      imported,
      addedToPlaylist,
      skipped
    };

  } catch (err) {
    console.error("M3U8 import error:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("openM3UFileDialog", async () => {
    const result = await dialog.showOpenDialog({
        title: "Import M3U Playlist",
        filters: [{ name: "Playlists", extensions: ["m3u", "m3u8"] }],
        properties: ["openFile"]
    });

    if (result.canceled || !result.filePaths.length) {
        return { canceled: true };
    }

    return {
        canceled: false,
        filePath: result.filePaths[0]   // ALWAYS a string
    };
});

ipcMain.handle("open-m3u8-file", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Select .m3u8 playlist",
    properties: ["openFile"],
    filters: [
      { name: "Playlist Files", extensions: ["m3u", "m3u8"] }
    ]
  });

  if (canceled || !filePaths.length) return { canceled: true };

  return { filePath: filePaths[0] };
});

// --- Save playlist image file ---

ipcMain.handle("savePlaylistImage", async (event, base64Data, playlistId) => {
  try {
    const userDataDir = app.getPath("userData");
    const folder = path.join(userDataDir, "playlist_images");

    if (!fs.existsSync(folder)) fs.mkdirSync(folder);

    // Generate random filename
    const randomName = crypto.randomUUID(); 
    const fileName = `${randomName}.png`;
    const filePath = path.join(folder, fileName);

    // Base64 → buffer
    const imageBuffer = Buffer.from(base64Data.split(",")[1], "base64");

    // Save file
    fs.writeFileSync(filePath, imageBuffer);

    return { success: true, fullPath: filePath, fileName };

  } 
  catch (err) {
    console.error("Error saving playlist image:", err);
    return { success: false };
  }
});

ipcMain.handle("updatePlaylistThumbnail", (event, playlistId, fullPath) => {
  try {
    db.prepare(`
      UPDATE Playlists
      SET thumbnail = ?
      WHERE id = ?
    `).run(fullPath, playlistId);

    return { success: true };

  } catch (err) {
    console.error("Error updating playlist thumbnail:", err);
    return { success: false };
  }
});

/* --------------- SETTINGS ----------------- */

function loadSettings() {
  try {
    if (!fs.existsSync(settingsPath)) {
      // If file doesn't exist, create with default settings
      const defaultSettings = {
        hotkeys: {
          playPause: 'Space',
          nextTrack: 'KeyN',
          prevTrack: 'KeyP',
          foward10: 'ArrowRight',
          back10: 'ArrowLeft',
          fullScreen: 'KeyF',
          mute: 'KeyM',
          volumeUp: 'ArrowUp',
          volumeDown: 'ArrowDown',
          reloadApp: 'F5',
        },
        // add other settings here
      };
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2), 'utf-8');
      return defaultSettings;
    }
    const data = fs.readFileSync(settingsPath, 'utf-8');
    return JSON.parse(data);
  } 
  catch (err) {
    console.error('Failed to load settings:', err);
    return {};
  }
}

loadSettings();

function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  } 
  catch (err) {
    console.error('Failed to save settings:', err);
  }
}

let settings = loadSettings();

ipcMain.handle('get-hotkeys', () => {
  // Return the hotkeys object from settings
  return settings.hotkeys || {};
});

ipcMain.handle('save-hotkeys', (event, newHotkeys) => {
  settings.hotkeys = newHotkeys;
  saveSettings(settings);
});

// ---------------- PLAYING QUEUE SYSTEM ---------------------

const queuePath = path.join(app.getPath("userData"), "playingQueue.json");

function loadQueue() {
  try {
    if (!fs.existsSync(queuePath)) {
      const emptyQueue = { 
        currentSong: null, 
        queue: [], 
        currentIndex: -1,
        shuffle: false,
        originalQueue: null,
        repeatMode: 0   // << NEW DEFAULT
      };
      fs.writeFileSync(queuePath, JSON.stringify(emptyQueue, null, 2));
      return emptyQueue;
    }

    const data = JSON.parse(fs.readFileSync(queuePath, "utf8"));

    if (!("queue" in data)) data.queue = [];
    if (!("currentSong" in data)) data.currentSong = null;
    if (!("currentIndex" in data)) data.currentIndex = -1;
    if (!("originalQueue" in data)) data.originalQueue = null;
    if (!("shuffle" in data)) data.shuffle = false;
    if (!("repeatMode" in data)) data.repeatMode = 0; // << ensure persistence

    return data;
  } 
  catch (err) {
    console.error("Failed to load queue:", err);
    return { currentSong: null, queue: [], currentIndex: -1, repeatMode: 0 };
  }
}

ipcMain.handle("getFavoriteStatus", (event, songId) => {
    return db.prepare("SELECT isFavorite FROM Songs WHERE id = ?").get(songId)?.isFavorite || 0;
});


function saveQueue(queue) {
  try {
    fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
  } 
  catch (err) {
    console.error("Failed to save queue:", err);
  }
}

ipcMain.handle("setPlayingQueue", (event, incoming) => {
  if (!incoming || typeof incoming !== "object") {
    console.error("Invalid queue data");
    return false;
  }

  const q = loadQueue();

  q.queue = Array.isArray(incoming.queue) ? incoming.queue : q.queue;
  q.currentIndex = typeof incoming.currentIndex === "number" ? incoming.currentIndex : q.currentIndex;
  q.currentSong = incoming.currentSong ?? q.currentSong;

  if (typeof incoming.repeatMode !== "undefined") {
    q.repeatMode = incoming.repeatMode;       // caller changes it
  } else if (typeof q.repeatMode !== "number") {
    q.repeatMode = 0;                         // ensure valid
  }

  if (typeof incoming.shuffle !== "undefined") q.shuffle = incoming.shuffle;
  if (typeof incoming.originalQueue !== "undefined") q.originalQueue = incoming.originalQueue;

  saveQueue(q);
  return true;
});

// Get queue
ipcMain.handle("getPlayingQueue", () => {
  return loadQueue();
});

function isSongInQueue(q, songId) {
  return q.queue.some(s => s.id === songId);
}

/* ipcMain.handle("addToQueue", async (event, songId) => {
  try {
    const q = loadQueue();

    // 🔎 Check if song already exists in queue
    const existingIndex = q.queue.findIndex(s => s.id === songId);

    if (existingIndex !== -1) {
      // Song already in queue → jump to it
      q.currentIndex = existingIndex;
      q.currentSong = q.queue[existingIndex];

      saveQueue(q);

      return {
        success: true,
        alreadyExists: true,
        song: q.currentSong,
        title: q.currentSong.title
      };
    }

    // Fetch full song row
    let song;
    try {
      song = db.prepare(`
        SELECT 
          s.id, s.filePath, s.fileName, s.extension, s.fileSize,
          s.createdDate, s.modifiedDate, s.title,
          s.artistID, ar.name AS artist,
          s.albumID, a.name AS album, a.albumArt AS cover,
          s.genreID, g.name AS genre,
          s.duration, s.year, s.isFavorite, s.playCounter,
          s.lastTimePlayed, s.addedDate
        FROM Songs s
        LEFT JOIN Albums a ON s.albumID = a.id
        LEFT JOIN Artists ar ON s.artistID = ar.id
        LEFT JOIN Genres g ON s.genreID = g.id
        WHERE s.id = ?
      `).get(songId);
    } 
    catch (err) {
      console.error("DB error fetching song:", err);
      return { success: false, error: "db_error" };
    }

    if (!song) return { success: false, error: "not_found" };

    // ➕ Add song to queue
    q.queue.push(song);

    // 🎵 If nothing was playing, start playing it
    //if (q.currentIndex === -1) {
    //  q.currentIndex = 0;
    //  q.currentSong = song;
    //}

    // 🔀 Keep originalQueue in sync when shuffle is on
    if (q.shuffle) {
      if (Array.isArray(q.originalQueue)) {
        q.originalQueue.push(song);
      } else {
        q.originalQueue = [...q.queue];
      }
    }

    saveQueue(q);

    return { success: true, queue: q, song, title: song.title };
  } 
  catch (error) {
    console.error("Unexpected error in addToQueue:", error);
    return { success: false, error: "unexpected" };
  }
}); */

ipcMain.handle("addToQueue", async (event, songId) => {
  try {
    const q = loadQueue();

    const normalizedId = Number(songId); // ✅ FIX

    // 🔎 Check if song already exists in queue
    const existingIndex = q.queue.findIndex(
      s => Number(s.id) === normalizedId
    );

    if (existingIndex !== -1) {
      q.currentIndex = existingIndex;
      q.currentSong = q.queue[existingIndex];

      saveQueue(q);

      return {
        success: true,
        alreadyExists: true,
        song: q.currentSong,
        title: q.currentSong.title
      };
    }

    // Fetch full song row
    let song;
    try {
      song = db.prepare(`
        SELECT 
          s.id, s.filePath, s.fileName, s.extension, s.fileSize,
          s.createdDate, s.modifiedDate, s.title,
          s.artistID, ar.name AS artist,
          s.albumID, a.name AS album, a.albumArt AS cover,
          s.genreID, g.name AS genre,
          s.duration, s.year, s.isFavorite, s.playCounter,
          s.lastTimePlayed, s.addedDate
        FROM Songs s
        LEFT JOIN Albums a ON s.albumID = a.id
        LEFT JOIN Artists ar ON s.artistID = ar.id
        LEFT JOIN Genres g ON s.genreID = g.id
        WHERE s.id = ?
      `).get(normalizedId);
    } 
    catch (err) {
      console.error("DB error fetching song:", err);
      return { success: false, error: "db_error" };
    }

    if (!song) return { success: false, error: "not_found" };

    q.queue.push(song);

    if (q.shuffle) {
      if (Array.isArray(q.originalQueue)) {
        q.originalQueue.push(song);
      } else {
        q.originalQueue = [...q.queue];
      }
    }

    saveQueue(q);

    return { success: true, queue: q, song, title: song.title };
  } 
  catch (error) {
    console.error("Unexpected error in addToQueue:", error);
    return { success: false, error: "unexpected" };
  }
});


ipcMain.handle("addToNext", async (event, songId) => {
  try {
    const q = loadQueue();

    // 🔎 Check if song already exists in queue
    const existingIndex = q.queue.findIndex(s => s.id === songId);

    // If queue is empty, just add & play
    if (q.queue.length === 0) {
      let song;
      try {
        song = db.prepare(`
          SELECT 
            s.id, s.filePath, s.fileName, s.extension, s.fileSize,
            s.createdDate, s.modifiedDate, s.title,
            s.artistID, ar.name AS artist,
            s.albumID, a.name AS album, a.albumArt AS cover,
            s.genreID, g.name AS genre,
            s.duration, s.year, s.isFavorite, s.playCounter,
            s.lastTimePlayed, s.addedDate
          FROM Songs s
          LEFT JOIN Albums a ON s.albumID = a.id
          LEFT JOIN Artists ar ON s.artistID = ar.id
          LEFT JOIN Genres g ON s.genreID = g.id
          WHERE s.id = ?
        `).get(songId);
      } 
      catch (err) {
        console.error("DB error fetching song:", err);
        return { success: false, error: "db_error" };
      }

      if (!song) return { success: false, error: "not_found" };

      q.queue.push(song);
      q.currentIndex = 0;
      q.currentSong = song;

      saveQueue(q);

      return { success: true, queue: q, song, title: song.title };
    }

    // 🔁 Song already in queue → MOVE it to next
    if (existingIndex !== -1) {
      const [existingSong] = q.queue.splice(existingIndex, 1);

      let insertPos = q.currentIndex + 1;
      if (existingIndex < q.currentIndex) insertPos--;

      q.queue.splice(insertPos, 0, existingSong);

      // 🔀 Keep originalQueue in sync when shuffle is on
      if (q.shuffle && Array.isArray(q.originalQueue)) {
        const origIdx = q.originalQueue.findIndex(s => s.id === songId);
        if (origIdx !== -1) {
          const [origSong] = q.originalQueue.splice(origIdx, 1);
          const origInsertPos =
            q.originalQueue.findIndex(s => s.id === q.currentSong.id) + 1;
          q.originalQueue.splice(origInsertPos, 0, origSong);
        }
      }

      saveQueue(q);
      
      return {
        success: true,
        moved: true,
        song: existingSong,
        title: existingSong.title
      };
    }

    // ➕ Song not in queue → fetch & insert next
    let song;
    try {
      song = db.prepare(`
        SELECT 
          s.id, s.filePath, s.fileName, s.extension, s.fileSize,
          s.createdDate, s.modifiedDate, s.title,
          s.artistID, ar.name AS artist,
          s.albumID, a.name AS album, a.albumArt AS cover,
          s.genreID, g.name AS genre,
          s.duration, s.year, s.isFavorite, s.playCounter,
          s.lastTimePlayed, s.addedDate
        FROM Songs s
        LEFT JOIN Albums a ON s.albumID = a.id
        LEFT JOIN Artists ar ON s.artistID = ar.id
        LEFT JOIN Genres g ON s.genreID = g.id
        WHERE s.id = ?
      `).get(songId);
    } 
    catch (err) {
      console.error("DB error fetching song:", err);
      return { success: false, error: "db_error" };
    }

    if (!song) return { success: false, error: "not_found" };

    const insertPos = q.currentIndex + 1;
    q.queue.splice(insertPos, 0, song);

    if (q.shuffle) {
      if (Array.isArray(q.originalQueue)) {
        const origPos =
          q.originalQueue.findIndex(s => s.id === q.currentSong.id) + 1;
        q.originalQueue.splice(origPos, 0, song);
      } 
      else {
        q.originalQueue = [...q.queue];
      }
    }

    saveQueue(q);
    return { success: true, queue: q, song, title: song.title };
  } 
  catch (err) {
    console.error("Unexpected error in addToNext:", err);
    return { success: false, error: "unexpected" };
  }
});

// Clear queue
ipcMain.handle("clearPlayingQueue", () => {
  const emptyData = {
    currentSong: null,
    queue: [],
    currentIndex: -1,
    shuffle: false,
    originalQueue: null,
    repeatMode: loadQueue().repeatMode // preserve
  };

  fs.writeFileSync(queuePath, JSON.stringify(emptyData, null, 2));
  return { success: true };
});

// Play specific song by ID (jump to it)
ipcMain.handle("playFromQueue", (event, songId) => {
  const q = loadQueue();
  const idx = q.queue.findIndex(s => s.id === songId);
  if (idx === -1) return null;

  q.currentIndex = idx;
  q.currentSong = q.queue[idx];

  saveQueue(q);
  return q.currentSong;
});

// Next song
ipcMain.handle("playNextInQueue", () => {
  const q = loadQueue();
  if (!q.queue.length) return null;

  if (q.currentIndex + 1 >= q.queue.length) return null;

  q.currentIndex++;
  q.currentSong = q.queue[q.currentIndex];

  saveQueue(q);
  return q.currentSong;
});

//  Previous song
ipcMain.handle("playPreviousInQueue", () => {
  const q = loadQueue();
  if (!q.queue.length) return null;

  if (q.currentIndex <= 0) return null;

  q.currentIndex--;
  q.currentSong = q.queue[q.currentIndex];

  saveQueue(q);
  return q.currentSong;
});

ipcMain.handle("toggleShuffle", () => {
  const q = loadQueue();

  q.shuffle = !q.shuffle;

  if (q.shuffle) {
    if (!q.originalQueue) q.originalQueue = [...q.queue];

    const currentSong = q.currentSong;
    const rest = q.queue.filter(s => s.id !== currentSong.id);

    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }

    q.queue = [currentSong, ...rest];
    q.currentIndex = 0;
  } 
  else {
    if (Array.isArray(q.originalQueue)) {
      const original = q.originalQueue;

      const idx = original.findIndex(s => s.id === q.currentSong.id);

      q.queue = original;
      q.currentIndex = idx === -1 ? 0 : idx;
    }

    q.originalQueue = null;
  }

  saveQueue(q);
  return q;
});

ipcMain.handle("search-in-database", (evt, text, tag) => {
    if (text.trim().length > 0) {
        saveSearchHistory(text.trim());
    }
    return searchDatabase(text, tag);
});

ipcMain.handle("get-search-history", () => {
  try {
    const rows = db.prepare(`
      SELECT term FROM SearchHistory
      ORDER BY lastUsed DESC
      LIMIT 10
    `).all();

    return rows;
  } 
  catch (err) {
    console.error("Error loading search history:", err);
    return []; // safe fallback
  }
});

ipcMain.handle("clear-search-history", () => {
  try {
    db.prepare(`DELETE FROM SearchHistory`).run();
    return true;
  } 
  catch (err) {
    console.error("Error clearing search history:", err);
    return false;
  }
});

function searchDatabase(text, tag) {
    const like = `%${text}%`;

    // Empty search = return nothing
    if (!text) {
        return {
            songs: [],
            videos: [],
            playlists: [],
            albums: [],
            artists: [],
            genres: []
        };
    }

    const results = {
        songs: [],
        videos: [],
        playlists: [],
        albums: [],
        artists: [],
        genres: []
    };

    // =====================================================
    // ALL MODE --------------------------------------------
    // =====================================================

    if (tag === "all") {
        results.songs = db.prepare(`
            SELECT 
              Songs.id,
              Songs.title,
              Songs.artist,
              Songs.fileName,
              Songs.year,
              Songs.duration,
              Songs.isFavorite,
              Albums.name AS albumName,
              Albums.albumArt AS albumArt
          FROM Songs
          LEFT JOIN Albums ON Albums.id = Songs.albumID
          WHERE 
              Songs.title LIKE ? 
              OR Songs.artist LIKE ? 
              OR Songs.fileName LIKE ?
          COLLATE NOCASE
        `).all(like, like, like);

        /* results.videos = db.prepare(`
            SELECT id, title, thumbnail FROM Videos WHERE title LIKE ? COLLATE NOCASE
        `).all(like); */

        // Videos (now includes duration)
          results.videos = db.prepare(`
            SELECT id, title, thumbnail, duration
            FROM Videos
            WHERE title LIKE ? COLLATE NOCASE
          `).all(like);

        results.playlists = db.prepare(`
            SELECT
                p.id,
                p.name,
                p.thumbnail,
                p.type,
                (
                    SELECT COUNT(*)
                    FROM PlaylistSongs ps
                    WHERE ps.playlistID = p.id
                ) AS count
            FROM Playlists p
            WHERE p.name LIKE ? COLLATE NOCASE
              AND p.id NOT IN (1,2)
            ORDER BY p.createdAt DESC
        `).all(like);

        results.albums = db.prepare(`
          SELECT
              a.id,
              a.name,
              a.artist,
              a.artistID,
              a.albumArt,
              (
                  SELECT COUNT(*)
                  FROM Songs s
                  WHERE s.albumID = a.id
              ) AS count
          FROM Albums a
          WHERE a.name LIKE ? COLLATE NOCASE
            OR a.artist LIKE ? COLLATE NOCASE
          ORDER BY a.name ASC
        `).all(like, like); 

          // ---------- ARTISTS ----------
          const rawArtists = db.prepare(`
              SELECT id, name
              FROM Artists
              WHERE name LIKE ? COLLATE NOCASE
              ORDER BY LOWER(name)
          `).all(like);

          const normalizeArtistName = (name) => {
              if (!name) return "";
              let n = name.trim();
              if (/, the$/i.test(n)) {
                  n = "The " + n.replace(/, the$/i, "");
              }
              n = n.replace(/\s*-\s*(Topic|Official|Channel|Music|Band)\b/gi, "");
              return n.trim();
          };

          results.artists = rawArtists.map(a => {
              const displayName = normalizeArtistName(a.name);

              // FIRST: try by artistID
              let arts = db.prepare(`
                  SELECT albumArt
                  FROM Albums
                  WHERE artistID = ?
                    AND albumArt IS NOT NULL
                    AND TRIM(albumArt) <> ''
                  LIMIT 4
              `).all(a.id);

              // SECOND: fallback by matching text
              if (arts.length === 0) {
                  arts = db.prepare(`
                      SELECT albumArt
                      FROM Albums
                      WHERE LOWER(artist) LIKE LOWER(?)
                        AND albumArt IS NOT NULL
                        AND TRIM(albumArt) <> ''
                      LIMIT 4
                  `).all(`%${displayName}%`);
              }

              return {
                  id: a.id,
                  name: displayName || a.name,
                  albumArts: arts.map(x => x.albumArt)
              };
          });

        results.genres = db.prepare(`
            SELECT id, name, createdAt
            FROM Genres
            WHERE name LIKE ? COLLATE NOCASE
            ORDER BY LOWER(name) ASC
        `).all(like).map(g => {
            // Get up to 4 album arts for this genre
            const albums = db.prepare(`
                SELECT DISTINCT a.albumArt
                FROM Albums a
                JOIN Songs s ON s.albumID = a.id
                WHERE
                  (s.genreID = @genreId OR LOWER(s.genres) LIKE LOWER(@genreName))
                  AND a.albumArt IS NOT NULL
                  AND TRIM(a.albumArt) <> ''
                LIMIT 4
            `).all({
                genreId: g.id,
                genreName: `%${g.name}%`
            });

            // Get song count
            const countRow = db.prepare(`
                SELECT COUNT(*) AS count
                FROM Songs
                WHERE genreID = @genreId OR LOWER(genres) LIKE LOWER(@genreName)
            `).get({
                genreId: g.id,
                genreName: `%${g.name}%`
            });

            return {
                ...g,
                albumArts: albums.map(a => a.albumArt),
                songCount: countRow.count || 0
            };
          });

        return results;
    }

    // =====================================================
    // TAG-SPECIFIC MODE -----------------------------------
    // =====================================================

    switch (tag) {

        case "songs":
            results.songs = db.prepare(`
                SELECT 
                    Songs.id,
                    Songs.title,
                    Songs.artist,
                    Songs.fileName,
                    Songs.year,
                    Songs.duration,
                    Songs.isFavorite,
                    Albums.name AS albumName,
                    Albums.albumArt AS albumArt
                FROM Songs
                LEFT JOIN Albums ON Albums.id = Songs.albumID
                WHERE 
                    Songs.title LIKE ? 
                    OR Songs.artist LIKE ? 
                    OR Songs.fileName LIKE ?
                COLLATE NOCASE
            `).all(like, like, like);
            break;

        case "videos":
          // include duration for grid rendering
          results.videos = db.prepare(`
            SELECT id, title, thumbnail, duration
            FROM Videos
            WHERE title LIKE ? COLLATE NOCASE
          `).all(like);
          break;

        case "playlists":
          results.playlists = db.prepare(`
              SELECT
                  p.id,
                  p.name,
                  p.thumbnail,
                  p.type,
                  (
                      SELECT COUNT(*)
                      FROM PlaylistSongs ps
                      WHERE ps.playlistID = p.id
                  ) AS count
              FROM Playlists p
              WHERE p.name LIKE ? COLLATE NOCASE
                AND p.type = 'custom'   -- optional, but keeps consistency
              ORDER BY p.createdAt DESC
          `).all(like);
          break;


        case "albums":
          results.albums = db.prepare(`
              SELECT
                  a.id,
                  a.name,
                  a.artist,
                  a.artistID,
                  a.albumArt,
                  COALESCE(Artists.name, a.artist) AS artistName,
                  (
                      SELECT COUNT(*)
                      FROM Songs s
                      WHERE s.albumID = a.id
                  ) AS count
              FROM Albums a
              LEFT JOIN Artists ON a.artistID = Artists.id
              WHERE a.name LIKE ? COLLATE NOCASE
                OR a.artist LIKE ? COLLATE NOCASE
              ORDER BY a.name ASC
          `).all(like, like);
          break;


        case "artists": {
            const rawArtists = db.prepare(`
                SELECT id, name
                FROM Artists
                WHERE name LIKE ? COLLATE NOCASE
                ORDER BY LOWER(name)
            `).all(like);

            const normalizeArtistName = (name) => {
                if (!name) return "";
                let n = name.trim();

                if (/, the$/i.test(n)) {
                    n = "The " + n.replace(/, the$/i, "");
                }

                n = n.replace(/\s*-\s*(Topic|Official|Channel|Music|Band)\b/gi, "");

                return n.trim();
            };

            results.artists = rawArtists.map(a => {
                const displayName = normalizeArtistName(a.name);

                // FIRST: try by artistID (stronger)
                let arts = db.prepare(`
                    SELECT albumArt
                    FROM Albums
                    WHERE artistID = ?
                      AND albumArt IS NOT NULL
                      AND TRIM(albumArt) <> ''
                    LIMIT 4
                `).all(a.id);

                // SECOND: fallback to matching artist text
                if (arts.length === 0) {
                    arts = db.prepare(`
                        SELECT albumArt
                        FROM Albums
                        WHERE LOWER(artist) LIKE LOWER(?)
                          AND albumArt IS NOT NULL
                          AND TRIM(albumArt) <> ''
                        LIMIT 4
                    `).all(`%${displayName}%`);
                }

                return {
                    id: a.id,
                    name: displayName || a.name,
                    albumArts: arts.map(x => x.albumArt)
                };
            });

            break;
        }

        case "genres": {
          const genres = db.prepare(`
              SELECT id, name, createdAt
              FROM Genres
              WHERE name LIKE ? COLLATE NOCASE
              ORDER BY LOWER(name) ASC
          `).all(like);

          results.genres = genres.map(g => {
              const albums = db.prepare(`
                  SELECT DISTINCT a.albumArt
                  FROM Albums a
                  JOIN Songs s ON s.albumID = a.id
                  WHERE
                    (s.genreID = @genreId OR LOWER(s.genres) LIKE LOWER(@genreName))
                    AND a.albumArt IS NOT NULL
                    AND TRIM(a.albumArt) <> ''
                  LIMIT 4
              `).all({
                  genreId: g.id,
                  genreName: `%${g.name}%`
              });

              const countRow = db.prepare(`
                  SELECT COUNT(*) AS count
                  FROM Songs
                  WHERE genreID = @genreId OR LOWER(genres) LIKE LOWER(@genreName)
              `).get({
                  genreId: g.id,
                  genreName: `%${g.name}%`
              });

              return {
                  ...g,
                  albumArts: albums.map(a => a.albumArt),
                  songCount: countRow.count || 0
              };
          });

          break;
        }

    }

    return results;
}


function saveSearchHistory(term) {
  try {
    const now = Date.now();

    // If exists, update count + timestamp
    const existing = db.prepare(`
      SELECT id FROM SearchHistory WHERE term = ?
    `).get(term);

    if (existing) {
      db.prepare(`
        UPDATE SearchHistory
        SET lastUsed = ?, count = count + 1
        WHERE id = ?
      `).run(now, existing.id);
    } 
    else {
      // Insert new
      db.prepare(`
        INSERT INTO SearchHistory (term, lastUsed)
        VALUES (?, ?)
      `).run(term, now);
    }

  } 
  catch (err) {
    console.error("Error saving search history:", err);
  }
}

/* GET SONGS FROM A FOLDER */
ipcMain.handle("get-songs-inside-folder", (event, folderPath) => {
  try {
    // MUST match how paths are stored in DB
    const normFolder = normalizePath(folderPath);

    const stmt = db.prepare(`
      SELECT 
        s.id,
        s.filePath,
        s.fileName,
        s.extension,
        s.fileSize,
        s.createdDate,
        s.modifiedDate,
        s.title,
        s.artistID,
        ar.name AS artist,
        s.albumID,
        a.name AS albumName,
        a.albumArt AS albumArt,
        s.genreID,
        g.name AS genre,
        s.duration,
        s.year,
        s.isFavorite,
        s.playCounter,
        s.lastTimePlayed,
        s.addedDate
      FROM Songs s
      LEFT JOIN Albums a ON s.albumID = a.id
      LEFT JOIN Artists ar ON s.artistID = ar.id
      LEFT JOIN Genres g ON s.genreID = g.id
      WHERE s.filePath LIKE ?
    `);

    // Important: "/%" avoids matching C:/Music2 when folder is C:/Music
    return stmt.all(normFolder + "/%");

  } catch (err) {
    console.error("Error loading folder songs:", err);
    return [];
  }
});

ipcMain.handle("save-queue-as-playlist", (event, name, imgBase64, songIDs) => {
  try {
    if (!name || !Array.isArray(songIDs) || songIDs.length === 0) {
      throw new Error("Invalid playlist creation request.");
    }

    // ---- FILTER VALID SONG IDs FIRST ----
    const placeholders = songIDs.map(() => "?").join(",");

    const rows = db.prepare(`
      SELECT id FROM Songs WHERE id IN (${placeholders})
    `).all(...songIDs);

    const validIDs = rows.map(r => r.id);
    const skipped = songIDs.length - validIDs.length;

    if (validIDs.length === 0) {
      return { success: false, error: "No valid song IDs found." };
    }

    // ---- CREATE PLAYLIST ----
    const result = db.prepare(`
      INSERT INTO Playlists (name, type)
      VALUES (?, 'custom')
    `).run(name);

    const playlistID = result.lastInsertRowid;

    // ---- SAVE IMAGE ----
    if (imgBase64) {
      const fullImgPath = savePlaylistImageSync(playlistID, imgBase64);
      db.prepare(`
        UPDATE Playlists SET thumbnail = ? WHERE id = ?
      `).run(fullImgPath, playlistID);
    }

    // ---- INSERT SONGS (TX) ----
    const insertSong = db.prepare(`
      INSERT OR IGNORE INTO PlaylistSongs (playlistID, songID)
      VALUES (?, ?)
    `);

    db.transaction(() => {
      for (const id of validIDs) {
        insertSong.run(playlistID, id);
      }
    })();

    return {
      success: true,
      id: playlistID,
      added: validIDs.length,
      skipped
    };

  } catch (err) {
    console.error("save-queue-as-playlist error:", err);
    return { success: false, error: err.message };
  }
});


ipcMain.handle("delete-playlist", (event, playlistID) => {
  try {
    if (!playlistID) throw new Error("Invalid playlist ID.");

    // Get current thumbnail path (if any)
    const row = db.prepare(`
      SELECT thumbnail FROM Playlists WHERE id = ?
    `).get(playlistID);

    if (!row) throw new Error("Playlist not found.");

    // Remove playlist entry → automatically removes PlaylistSongs
    db.prepare(`
      DELETE FROM Playlists WHERE id = ?
    `).run(playlistID);

    // Remove thumbnail file if present
    if (row.thumbnail && fs.existsSync(row.thumbnail)) {
      fs.unlinkSync(row.thumbnail);
    }

    return { success: true };
  } 
  catch (err) {
    console.error("delete-playlist error:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("add-songs-to-playlist", (event, playlistID, songIDs) => {
    try {
        const insert = db.prepare(`
          INSERT OR IGNORE INTO PlaylistSongs (playlistID, songID)
          VALUES (?, ?)
        `);

        const tx = db.transaction((ids) => {
          ids.forEach(id => insert.run(playlistID, id));
        });

        tx(songIDs);

        return { success: true };
    } 
    catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle("addSongToPlaylists", (event, songId, playlistIds) => {
  try {
    if (!songId || !Array.isArray(playlistIds)) {
      return { success: false, error: "invalid_args" };
    }

    const insert = db.prepare(`
      INSERT OR IGNORE INTO PlaylistSongs (playlistID, songID)
      VALUES (?, ?)
    `);

    const tx = db.transaction((pids) => {
      pids.forEach(pid => insert.run(pid, songId));
    });

    tx(playlistIds);

    return { success: true };
  }
  catch (err) {
    console.error("addSongToPlaylists failed:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("getPlaylists", () => {
  try {
    return db.prepare(`
      SELECT id, name, type, thumbnail
      FROM Playlists
    `).all();
  } 
  catch (err) {
    console.error("getPlaylists failed:", err);
    return []; // safe fallback to renderer
  }
});

ipcMain.handle('export-queue-to-m3u8', async () => {
  if (!fs.existsSync(queueFilePath)) {
    throw new Error('No playing queue found.');
  }

  // Read the queue JSON file
  const queueDataRaw = fs.readFileSync(queueFilePath, 'utf8');
  const queueData = JSON.parse(queueDataRaw);

  if (!queueData.queue || queueData.queue.length === 0) {
    throw new Error('Playing queue is empty.');
  }

  // Build M3U8 content
  let m3uContent = '#EXTM3U\n';

  for (const song of queueData.queue) {
    const duration = Math.round(song.duration) || 0;
    const displayTitle = song.artist && song.title
      ? `${song.artist} - ${song.title}`
      : song.title || path.basename(song.filePath);

    m3uContent += `#EXTINF:${duration},${displayTitle}\n`;
    m3uContent += `${song.filePath}\n`;
  }

  // Show save dialog
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export Playlist to M3U8',
    defaultPath: 'playlist.m3u8',
    filters: [{ name: 'M3U8 Playlist', extensions: ['m3u8'] }]
  });

  if (canceled || !filePath) {
    throw new Error('Export cancelled');
  }

  fs.writeFileSync(filePath, m3uContent, 'utf8');
});

// Recently Added
ipcMain.handle('getRecentlyAddedSongs', () => {
  return db.prepare(`
    SELECT 
      Songs.id,
      Songs.title,
      Songs.artist,
      Songs.isFavorite,
      Albums.albumArt
    FROM Songs
    LEFT JOIN Albums ON Albums.id = Songs.albumID
    ORDER BY Songs.addedDate DESC
    LIMIT 9
  `).all();
});

// Recently Played
ipcMain.handle('getRecentlyPlayedSongs', () => {
  return db.prepare(`
    SELECT 
      Songs.id,
      Songs.title,
      Songs.artist,
      Songs.isFavorite,
      Albums.albumArt
    FROM Songs
    LEFT JOIN Albums ON Albums.id = Songs.albumID
    WHERE Songs.lastTimePlayed IS NOT NULL
    ORDER BY Songs.lastTimePlayed DESC
    LIMIT 9
  `).all();
});

// Most Played
ipcMain.handle('getMostPlayedSongs', () => {
  return db.prepare(`
    SELECT 
      Songs.id,
      Songs.title,
      Songs.artist,
      Songs.isFavorite,
      Albums.albumArt
    FROM Songs
    LEFT JOIN Albums ON Albums.id = Songs.albumID
    WHERE Songs.playCounter > 0
    ORDER BY Songs.playCounter DESC
    LIMIT 9
  `).all();
});

// Recently Favorited
ipcMain.handle('getRecentlyFavoritedSongs', () => {
  return db.prepare(`
    SELECT 
      Songs.id,
      Songs.title,
      Songs.artist,
      Songs.isFavorite,
      Albums.albumArt
    FROM Songs
    LEFT JOIN Albums ON Albums.id = Songs.albumID
    WHERE Songs.isFavorite = 1
    ORDER BY Songs.favDate DESC
    LIMIT 9
  `).all();
});

// Recent playlists (no album art needed)
ipcMain.handle('getRecentPlaylists', () => {
  try {
    const rows = db.prepare(`
      SELECT 
        p.id,
        p.name,
        p.thumbnail,
        p.type,
        (
          SELECT COUNT(*)
          FROM PlaylistSongs ps
          WHERE ps.playlistID = p.id
        ) AS count
      FROM Playlists p
      WHERE p.type = 'custom'   -- automatically excludes Favorites/History
      ORDER BY p.createdAt DESC
      LIMIT 10
    `).all();

    return rows;
  } 
  catch (err) {
    console.error("Error loading recent playlists:", err);
    return [];
  }
});


ipcMain.handle('getMostFavoritedArtists', () => {
  // 1) Fetch top favorited artists
  const raw = db.prepare(`
    SELECT 
      Artists.id,
      Artists.name,
      COUNT(Songs.id) AS favoriteCount
    FROM Artists
    JOIN Songs ON Songs.artistID = Artists.id
    WHERE Songs.isFavorite = 1
    GROUP BY Artists.id
    ORDER BY favoriteCount DESC
    LIMIT 10
  `).all();

  // same normalization as get-artists
  const normalizeArtistName = (name) => {
    if (!name) return '';
    let n = name.trim();

    if (/, the$/i.test(n)) {
      n = 'The ' + n.replace(/, the$/i, '');
    }

    n = n.replace(/\s*-\s*(Topic|Official|Channel|Music|Band)\b/gi, '');
    return n.trim();
  };

  const result = raw.map(a => {
    const displayName = normalizeArtistName(a.name);

    // --- Try albumArts by artistID ---
    let albums = db.prepare(`
      SELECT albumArt FROM Albums
      WHERE artistID = @artistId
        AND albumArt IS NOT NULL
        AND TRIM(albumArt) <> ''
      LIMIT 4
    `).all({ artistId: a.id });

    // --- Fallback: match Albums.artist text ---
    if (!albums || albums.length === 0) {
      albums = db.prepare(`
        SELECT albumArt FROM Albums
        WHERE LOWER(artist) LIKE LOWER(@artistName)
          AND albumArt IS NOT NULL
          AND TRIM(albumArt) <> ''
        LIMIT 4
      `).all({ artistName: `%${displayName}%` });
    }

    return {
      id: a.id,
      name: displayName || a.name,
      favoriteCount: a.favoriteCount,
      albumArts: (albums || []).map(x => x.albumArt)
    };
  });

  return result;
});

ipcMain.handle("incrementPlayCounter", (event, songId) => {
  try {
    const now = Date.now();
    db.prepare(`
      UPDATE Songs
      SET playCounter = playCounter + 1,
          lastTimePlayed = ?
      WHERE id = ?
    `).run(now, songId);
    return true;
  } 
  catch (err) {
    console.error("incrementPlayCounter failed:", err);
    return false;
  }
});

// HISTORY PLAYED SONGS

ipcMain.handle('getHistorySongs', () => {
  try {
    return db.prepare(`
      SELECT 
        s.*, 
        a.name AS albumName,
        a.albumArt
      FROM Songs s
      LEFT JOIN Albums a ON a.id = s.albumID
      WHERE s.lastTimePlayed IS NOT NULL
      ORDER BY s.lastTimePlayed DESC
      LIMIT 50
    `).all();
  } 
  catch (err) {
    console.error("getHistorySongs error:", err);
    return [];
  }
});

ipcMain.handle('getHistoryCount', () => {
  try {
    return db.prepare(`
      SELECT COUNT(*) AS count 
      FROM Songs 
      WHERE lastTimePlayed IS NOT NULL
    `).get().count;
  } 
  catch (err) {
    console.error("getHistorySongs error:", err);
    return [];
  }
});

ipcMain.handle("export-playlist-to-m3u8", async (event, payload) => {
  try {
    const { playlistId, songs } = payload;

    if (!songs || !songs.length) {
      throw new Error("Playlist is empty");
    }

    // Build M3U8 content
    let m3uContent = "#EXTM3U\n";

    for (const song of songs) {
      const duration = Math.round(song.duration) || 0;

      const displayTitle = (song.artist && song.title)
        ? `${song.artist} - ${song.title}`
        : song.title || path.basename(song.filePath);

      m3uContent += `#EXTINF:${duration},${displayTitle}\n`;
      m3uContent += `${song.filePath}\n`;
    }

    // Ask for save path
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Export Playlist to M3U8",
      defaultPath: `playlist-${playlistId}.m3u8`,
      filters: [{ name: "M3U8 Playlist", extensions: ["m3u8"] }],
    });

    if (canceled || !filePath)
      throw new Error("Export cancelled");

    fs.writeFileSync(filePath, m3uContent, "utf8");

    return { success: true, filePath };
  }
  catch (err) {
    console.error("Error exporting playlist:", err);
    throw err;
  }
});

ipcMain.handle("get-playlist-by-id", (event, playlistId) => {
  try {
    const row = db.prepare(`
      SELECT id, name, type, thumbnail, createdAt
      FROM Playlists
      WHERE id = ?
    `).get(playlistId);

    if (!row) return { success: false, error: "Playlist not found" };

    return { success: true, playlist: row };
  }
  catch (err) {
    console.error("Error loading playlist by id:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("update-playlist", async (event, { id, name, imageBase64 }) => {
  try {
    if (!id) throw new Error("Playlist ID missing.");

    db.prepare(`
      UPDATE Playlists
      SET name = ?, thumbnail = ?
      WHERE id = ?
    `).run(name, imageBase64 || null, id);

    return { success: true };
  }
  catch (err) {
    console.error("Error updating playlist:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("removeFromQueue", async (event, songId) => {
  try {
    const q = loadQueue();
    if (!q || !Array.isArray(q.queue)) {
      return { success: false, error: "queue_not_initialized" };
    }

    // Remove from visible queue
    const index = q.queue.findIndex(s => s.id == songId);
    if (index === -1) {
      return { success: false, error: "not_in_queue" };
    }

    q.queue.splice(index, 1);

    // Also remove from originalQueue if shuffle is ON
    if (q.shuffle && Array.isArray(q.originalQueue)) {
      const idx2 = q.originalQueue.findIndex(s => s.id == songId);
      if (idx2 !== -1) q.originalQueue.splice(idx2, 1);
    }

    // Adjust currentIndex
    if (q.currentIndex > index) {
      q.currentIndex--;
    }

    // If the removed song *was* currently playing
    if (q.currentSong && q.currentSong.id == songId) {
      q.currentSong = q.queue[q.currentIndex] || null;
    }

    // Prevent invalid index
    if (q.currentIndex < 0) q.currentIndex = 0;
    if (q.currentIndex >= q.queue.length) {
      q.currentIndex = q.queue.length - 1;
    }

    // Save queue
    saveQueue(q);

    return { success: true, queue: q };

  } catch (err) {
    console.error("removeFromQueue error:", err);
    return { success: false, error: "unexpected" };
  }
});

ipcMain.handle("isSongInAnyPlaylist", (event, songId) => {
  try {
    const row = db.prepare(`
      SELECT COUNT(*) AS count
      FROM PlaylistSongs
      WHERE songID = ?
    `).get(songId);

    return row.count > 0;
  } 
  catch (err) {
    return false;
  }
});

ipcMain.handle("setRepeatMode", (event, mode) => {
  const q = loadQueue();
  q.repeatMode = mode;
  saveQueue(q);
  return { success: true };
});

ipcMain.handle("getRepeatMode", () => {
  const q = loadQueue();
  return q.repeatMode ?? 0;  // default = Repeat Playlist
});

ipcMain.handle("addSongsToQueue", async (event, songIdsOrRows) => {
  try {
    const q = loadQueue();

    let added = 0;
    let alreadyInQueue = 0;
    let failed = 0;

    const wasEmpty = q.queue.length === 0;

    for (const item of songIdsOrRows) {
      let song;

      // 🔎 Resolve song
      try {
        if (typeof item === "number" || typeof item === "string") {
          song = db.prepare(`
            SELECT 
              s.id, s.filePath, s.fileName, s.extension, s.fileSize,
              s.createdDate, s.modifiedDate, s.title,
              s.artistID, ar.name AS artist,
              s.albumID, a.name AS album, a.albumArt AS cover,
              s.genreID, g.name AS genre,
              s.duration, s.year, s.isFavorite, s.playCounter,
              s.lastTimePlayed, s.addedDate
            FROM Songs s
            LEFT JOIN Albums a ON s.albumID = a.id
            LEFT JOIN Artists ar ON s.artistID = ar.id
            LEFT JOIN Genres g ON s.genreID = g.id
            WHERE s.id = ?
          `).get(item);
        } else if (item && typeof item.id !== "undefined") {
          song = item;
        }
      } 
      catch {
        failed++;
        continue;
      }

      if (!song) {
        failed++;
        continue;
      }

      // 🚫 Duplicate protection
      if (q.queue.some(s => s.id === song.id)) {
        alreadyInQueue++;
        continue;
      }

      // ➕ Add song
      q.queue.push(song);
      added++;

      // 🔀 Keep originalQueue in sync when shuffle is on
      if (q.shuffle) {
        if (Array.isArray(q.originalQueue)) {
          q.originalQueue.push(song);
        } else {
          q.originalQueue = [...q.queue];
        }
      }
    }

    // ▶️ Start playing if queue was empty
    if (wasEmpty && q.queue.length > 0) {
      q.currentIndex = 0;
      q.currentSong = q.queue[0];
    }

    saveQueue(q);

    return {
      success: true,
      added,
      alreadyInQueue,
      failed,
      queue: q
    };
  } 
  catch (err) {
    console.error("addSongsToQueue error:", err);
    return { success: false, error: err.message };
  }
});

// ----------SETTINGS--------------

let syncWatchEnabled = getSetting("syncWatchEnabled", false);
let hideBarsVideoEnabled = getSetting("hideBarsVideoEnabled", false);

function getSetting(key, defaultValue = null) {
  const row = db.prepare(`SELECT value FROM Settings WHERE key = ?`).get(key);
  return row ? JSON.parse(row.value) : defaultValue;
}

function setSetting(key, value) {
  db.prepare(`
    INSERT INTO Settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, JSON.stringify(value));
}

ipcMain.handle("set-sync-watch", (event, enabled) => {
  syncWatchEnabled = enabled;
  setSetting("syncWatchEnabled", enabled);

  if (enabled) {
    console.log("-> Sync/Watch enabled from settings");
    loadWatchFolders();
  } 
  else {
    console.log("-> Sync/Watch disabled from settings");
    if (watcher) {
      watcher.close().catch(()=>{});
      watcher = null;
    }
  }
  return true;
});

ipcMain.handle("get-sync-watch", () => {
  return syncWatchEnabled;
});

//----------------------

let songLibrarySort = getSetting("songLibrarySort", "added_asc");

ipcMain.handle("get-song-library-sort", () => {
  return songLibrarySort;
});

ipcMain.handle("set-song-library-sort", (event, sortKey) => {
  songLibrarySort = sortKey;
  setSetting("songLibrarySort", sortKey);
  return true;
});

//----------------------

let playlistsSort = getSetting("playlistsSort", "added_asc");

ipcMain.handle("get-playlists-sort", () => {
  return playlistsSort;
});

ipcMain.handle("set-playlists-sort", (event, sortKey) => {
  playlistsSort = sortKey;
  setSetting("playlistsSort", sortKey);
  return true;
});

//----------------------

let categorySort = getSetting("categorySort", "added_asc");

ipcMain.handle("get-category-sort", () => {
  return categorySort;
});

ipcMain.handle("set-category-sort", (event, sortKey) => {
  categorySort = sortKey;
  setSetting("categorySort", sortKey);
  return true;
});

//----------------------

let playlistSongsSort = getSetting("playlistSongsSort", "added_asc");

ipcMain.handle("get-playlist-songs-sort", () => {
  return playlistSongsSort;
});

ipcMain.handle("set-playlist-songs-sort", (event, sortKey) => {
  playlistSongsSort = sortKey;
  setSetting("playlistSongsSort", sortKey);
  return true;
});

//----------------------

let folderSongsSort = getSetting("folderSongsSort", "added_asc");

ipcMain.handle("get-folder-songs-sort", () => {
  return folderSongsSort;
});

ipcMain.handle("set-folder-songs-sort", (event, sortKey) => {
  folderSongsSort = sortKey;
  setSetting("folderSongsSort", sortKey);
  return true;
});

//----------------------

ipcMain.handle("set-hide-bars", (event, enabled) => {
  hideBarsVideoEnabled = enabled;
  setSetting("hideBarsVideoEnabled", enabled);
  return true;
});

ipcMain.handle("get-hide-bars", () => {
  return hideBarsVideoEnabled;
});

// VOLUME--------------------

let maxVolume = getSetting("maxVolume") || 1;  // default to 100%

ipcMain.handle("get-max-volume", () => {
    return maxVolume;
});

ipcMain.handle("set-max-volume", (event, value) => {
    maxVolume = value;
    setSetting("maxVolume", value); // save permanently
    return true;
});

//------ RELOAD APP -------

ipcMain.on("hard-reload", (event) => {
  event.sender.reloadIgnoringCache();
});

ipcMain.on("open-devtools", (event) => {
  event.sender.openDevTools({ mode: "detach" });
});

// ------- DATA -------------

ipcMain.handle('open-data-folder', () => {
  const userDataDir = app.getPath('userData');
  shell.openPath(userDataDir);
});

// ------------ get-external-song-info---------------

ipcMain.handle("get-external-song-info", async (_, filePath) => {
  try {
    const metadata = await mm.parseFile(filePath, { duration: true });
    const { common, format } = metadata;

    let albumArt = null;

    if (common.picture && common.picture.length > 0) {
      albumArt = await saveAlbumArtAsJpg(common.picture[0]);
    }

    return {
      title: common.title || path.basename(filePath),
      artist: common.artist || "Unknown Artist",
      album: common.album || "Unknown Album",
      year: common.year || null,
      duration: format.duration || 0,
      albumArt,
      filePath,
      external: true
    };
  } 
  catch (err) {
    console.warn("External metadata failed:", err.message);

    return {
      title: path.basename(filePath),
      artist: "Unknown Artist",
      album: "Unknown Album",
      year: null,
      duration: 0,
      albumArt: null,
      filePath,
      external: true
    };
  }
});


// ---- FILE INFO ID3 -----

/* async function getFileInfo(filePath) {
  const metadata = await mm.parseFile(filePath, { duration: true });
  const { common, format } = metadata;

  const stats = fs.statSync(filePath);

  // Album art (optional)
  let picture = null;

  if (common.picture?.length) {
    picture = {
      format: common.picture[0].format || "image/jpeg",
      data: common.picture[0].data.toString("base64")
    }
  }

  return {
    // ---- FILE ----
    fileName: path.basename(filePath),
    filePath,
    fileSize: stats.size,
    createdTime: stats.birthtimeMs,
    modifiedTime: stats.mtimeMs,

    // ---- TAGS ----
    title: common.title || path.basename(filePath),
    artist: common.artist || "Unknown Artist",
    album: common.album || "",
    genre: common.genre?.join(", ") || "",
    year: common.year || "",
    comment: common.comment?.join(", ") || "",

    // ---- AUDIO ----
    duration: format.duration || 0,
    codec: format.codec || format.container || "",
    bitrate: format.bitrate || 0,
    frequency: format.sampleRate || 0,

    // ---- ART ----
    picture
  };
} */

async function getFileInfo(filePath) {
  // ---- AUDIO METADATA ----
  const metadata = await mm.parseFile(filePath, { duration: true });
  const { common, format } = metadata;

  // ---- FILE STATS ----
  const stats = fs.statSync(filePath);

  // ---- DB LOOKUP (ALBUM ART) ----
  const row = db.prepare(`
    SELECT a.albumArt
    FROM Songs s
    LEFT JOIN Albums a ON s.albumID = a.id
    WHERE s.filePath = ?
  `).get(filePath);

  let albumArt = null;
  if (row?.albumArt) {
    albumArt = pathToFileURL(row.albumArt).href;
  }

  return {
    // ---- FILE ----
    fileName: path.basename(filePath),
    filePath,
    fileSize: stats.size,
    createdTime: stats.birthtimeMs,
    modifiedTime: stats.mtimeMs,

    // ---- TAGS ----
    title: common.title || path.basename(filePath),
    artist: common.artist || "Unknown Artist",
    album: common.album || "",
    genre: common.genre?.join(", ") || "",
    year: common.year || "",
    comment: parseCommentField(common.comment),

    // ---- AUDIO ----
    duration: format.duration || 0,
    codec: format.codec || format.container || "",
    bitrate: format.bitrate || 0,
    frequency: format.sampleRate || 0,

    // ---- ART (FROM DB) ----
    albumArt
  };
}

function parseCommentField(commentField) {
  if (!commentField) return '';

  return commentField
    .map(c => {
      if (typeof c === 'string') return c;
      if (typeof c === 'object') {
        if (Array.isArray(c.text)) return c.text.join('; ');
        if (typeof c.text === 'string') return c.text;
        return JSON.stringify(c.text);
      }
      return String(c);
    })
    .join('; ');
}

ipcMain.handle("getFileInfo", (_, filePath) => getFileInfo(filePath));

/* ----------------------------- */

function rebuildCachesFromDatabase2() {
  // Clear existing caches
  cachedSongs.clear();
  cachedVideos.clear();

  // Rebuild Songs cache
  const songRows = db.prepare(`
    SELECT filePath FROM Songs
  `).all();

  for (const row of songRows) {
    cachedSongs.add(normalizePath(row.filePath));
  }

  // Rebuild Videos cache
  const videoRows = db.prepare(`
    SELECT filePath FROM Videos
  `).all();

  for (const row of videoRows) {
    cachedVideos.add(normalizePath(row.filePath));
  }

  console.log("Caches rebuilt:", {
    songs: cachedSongs.size,
    videos: cachedVideos.size
  });
}

function rebuildCachesFromDatabase() {
  cachedSongs.clear();
  cachedVideos.clear();

  const songRows = db.prepare("SELECT filePath FROM Songs").all();
  for (const row of songRows) {
    cachedSongs.add(normalizePath(row.filePath));
  }

  const videoRows = db.prepare("SELECT filePath FROM Videos").all();
  for (const row of videoRows) {
    cachedVideos.add(normalizePath(row.filePath));
  }
}



/* console.log("FFMPEG PATH:", ffmpegPath);
console.log("FFPROBE PATH:", ffprobePath);

try {
  const test1 = child_process.execSync(`"${ffmpegPath}" -version`, { encoding: "utf8" });
  console.log("FFMPEG OK");
} catch (err) {
  console.log("FFMPEG FAIL:", err.message);
}

try {
  const test2 = child_process.execSync(`"${ffprobePath}" -version`, { encoding: "utf8" });
  console.log("FFPROBE OK");
} catch (err) {
  console.log("FFPROBE FAIL:", err.message);
} */





































