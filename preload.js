const { contextBridge, ipcRenderer, shell } = require('electron');
const { pathToFileURL } = require("url");

contextBridge.exposeInMainWorld('electronAPI', {
    onOpenFile: (cb) => ipcRenderer.on('open-media-file', (_, file) => cb(file)),
    getExternalSongInfo: (filePath) => ipcRenderer.invoke("get-external-song-info", filePath),
    
    openExternal: (url) => shell.openExternal(url),
    minimizeWindow: () => ipcRenderer.send("minimize-window"),
    maxUnmaxWindow: () => ipcRenderer.send("max-unmax-window"),
    closeWindow: () => ipcRenderer.send("close-window"),
    isWindowMaximized: () => ipcRenderer.invoke('isWindowMaximized'),
    updatePlaybackState: (data) => ipcRenderer.send('update-playback-state', data),
    onControl: (callback) => ipcRenderer.on('thumbnail-control', (_, action) => callback(action)),

    selectFiles: (type) => ipcRenderer.invoke('selectFiles', type),
    readFileBuffer: (filePath) => ipcRenderer.invoke('readFileBuffer', filePath),
    saveMediaFiles: (type, data) => ipcRenderer.invoke('saveMediaFiles', type, data),
    selectFolders: () => ipcRenderer.invoke('selectFolders'),
    processFolders: (folders) => ipcRenderer.invoke('processFolders', folders),

    addSongs: () => ipcRenderer.invoke('add-songs'),
    addVideos: () => ipcRenderer.invoke('add-videos'),
    addFolders: () => ipcRenderer.invoke('add-folders'),
    addAudioFolders: () => ipcRenderer.invoke('add-audio-folders'),
    addVideoFolders: () => ipcRenderer.invoke('add-video-folders'),

    onImportProgress: (callback) => ipcRenderer.on("import-progress", callback),
    
    getSongs: () => ipcRenderer.invoke('get-songs'),
    getVideos: () => ipcRenderer.invoke('get-videos'),

    playVideo: (id) => ipcRenderer.invoke("play-video", id),

    getSongBuffer: (filePath) => ipcRenderer.invoke('get-song-buffer', filePath),

    getSongById: (id) => ipcRenderer.invoke('get-song-by-id', id),

    toURL: (filePath) => pathToFileURL(filePath).href,

    removeFolder: (folderPath) => ipcRenderer.invoke('remove-folder', folderPath),
    reloadFolders: () => ipcRenderer.invoke('reload-folders'),
    
    fullFolderRescan: () => ipcRenderer.invoke("full-folder-rescan"),

    getWatchFolders: () => ipcRenderer.invoke('get-watch-folders'),
    onIndexProgress: (cb) => ipcRenderer.on('index-progress', cb),
    onToast: (cb) => ipcRenderer.on('toast', cb),

    
    getFolderStats: (folderPath) => ipcRenderer.invoke('get-folder-stats', folderPath),
    openFolder: (path) => ipcRenderer.invoke("open-folder", path),
    getSubfolders: (p) => ipcRenderer.invoke("get-subfolders", p),

    onFileRenamed: (callback) => ipcRenderer.on('file-renamed', callback),
    onFileRemoved: (callback) => ipcRenderer.on('file-removed', callback),

    deleteSong: (id) => ipcRenderer.invoke('delete-song', id),
    deleteVideo: (id) => ipcRenderer.invoke('delete-video', id),

    songAdded: (callback) => ipcRenderer.on('song-added', callback),
    videoAdded: (callback) => ipcRenderer.on('video-added', callback),
    songUpdated: (callback) => ipcRenderer.on('song-updated', callback),

    getVideoById: (id) => ipcRenderer.invoke('get-video-by-id', id),

    showInExplorer: (songId) => ipcRenderer.invoke("show-in-explorer", songId),
    showVideoInExplorer: (videoId) => ipcRenderer.invoke("show-video-in-explorer", videoId),

    getArtists: () => ipcRenderer.invoke('get-artists'),
    getAlbums: () => ipcRenderer.invoke('get-albums'),
    getGenres: () => ipcRenderer.invoke('get-genres'),

    getSongsByArtist: (artistID) => ipcRenderer.invoke('getSongsByArtist', artistID),
    getSongsByAlbum:  (albumID)  => ipcRenderer.invoke('getSongsByAlbum', albumID),
    getSongsByGenre:  (genreID)  => ipcRenderer.invoke('getSongsByGenre', genreID),

    getHotkeys: () => ipcRenderer.invoke('get-hotkeys'),
    saveHotkeys: (hotkeys) => ipcRenderer.invoke('save-hotkeys', hotkeys),

    getFavoriteSongs:  ()  => ipcRenderer.invoke('getFavoriteSongs'),
    getFavoritesCount:  ()  => ipcRenderer.invoke('getFavoritesCount'),
    getAllPlaylists: () => ipcRenderer.invoke("getAllPlaylists"),

    setPlayingQueue: (queueData) => ipcRenderer.invoke("setPlayingQueue", queueData),
    getPlayingQueue: () => ipcRenderer.invoke("getPlayingQueue"),
    addToQueue: (song) => ipcRenderer.invoke("addToQueue", song),
    clearPlayingQueue: () => ipcRenderer.invoke("clearPlayingQueue"),

    createPlaylist: (name, thumbnail) => ipcRenderer.invoke("createPlaylist", name, thumbnail),
    openFile: (options) => ipcRenderer.invoke("openFile", options),

    getPlaylistInfo: (id) => ipcRenderer.invoke("getPlaylistInfo", id),
    getSongsByPlaylist: (id) => ipcRenderer.invoke("getSongsByPlaylist", id),

    savePlaylistImage: (base64, playlistId) => ipcRenderer.invoke("savePlaylistImage", base64, playlistId),
    updatePlaylistThumbnail: (id, path) => ipcRenderer.invoke("updatePlaylistThumbnail", id, path),

    onQueueUpdated: (callback) => ipcRenderer.on("queue-updated", callback),
    playNextInQueue: () => ipcRenderer.invoke("playNextInQueue"),
    playPreviousInQueue: () => ipcRenderer.invoke("playPreviousInQueue"),

    openM3U8File: () => ipcRenderer.invoke('open-m3u8-file'),
    importM3U8Playlist: (filePath) => ipcRenderer.invoke('import-m3u8-playlist', filePath),

    toggleShuffle: () => ipcRenderer.invoke("toggleShuffle"),

    search: (text, tag) => ipcRenderer.invoke("search-in-database", text, tag),
    getSearchHistory: () => ipcRenderer.invoke("get-search-history"),
    clearSearchHistory: () => ipcRenderer.invoke("clear-search-history"),

    getSongsInsideFolder: (folderPath) => ipcRenderer.invoke("get-songs-inside-folder", folderPath),

    saveQueueAsPlaylistBackEnd: (name, imgBase64, songIDs) => ipcRenderer.invoke("save-queue-as-playlist", name, imgBase64, songIDs),

    deletePlaylist: (playlistID) => ipcRenderer.invoke("delete-playlist", playlistID),

    addSongsToPlaylist: (playlistID, songIDs) => ipcRenderer.invoke("add-songs-to-playlist", playlistID, songIDs),
    addSongToPlaylists: (songId, playlistIds) => ipcRenderer.invoke("addSongToPlaylists", songId, playlistIds),

    getPlaylists: () => ipcRenderer.invoke("getPlaylists"),

    exportQueueToM3U8: () => ipcRenderer.invoke('export-queue-to-m3u8'),

    getHomeSectionData: (sectionKey) => ipcRenderer.invoke('get-home-section-data', sectionKey),
    getRecentlyAddedSongs: () => ipcRenderer.invoke('getRecentlyAddedSongs'),
    getRecentlyPlayedSongs: () => ipcRenderer.invoke('getRecentlyPlayedSongs'),
    getMostPlayedSongs: () => ipcRenderer.invoke('getMostPlayedSongs'),
    getRecentPlaylists: () => ipcRenderer.invoke('getRecentPlaylists'),
    getRecentlyFavoritedSongs: () => ipcRenderer.invoke('getRecentlyFavoritedSongs'),
    getMostFavoritedArtists: () => ipcRenderer.invoke('getMostFavoritedArtists'),
    
    setSongFavorite: (songId, fav) => ipcRenderer.invoke('setSongFavorite', songId, fav),

    incrementPlayCounter: (songId) => ipcRenderer.invoke("incrementPlayCounter", songId),

    getHistorySongs: () => ipcRenderer.invoke('getHistorySongs'),
    getHistoryCount: () => ipcRenderer.invoke('getHistoryCount'),

    exportPlaylistToM3U8: (payload) => ipcRenderer.invoke("export-playlist-to-m3u8", payload),

    getPlaylistById: (id) => ipcRenderer.invoke("get-playlist-by-id", id),

    updatePlaylist: (id, name, imageBase64) => ipcRenderer.invoke("update-playlist", { id, name, imageBase64 }),

    removeFromQueue: (songId) => ipcRenderer.invoke("removeFromQueue", songId),

    getFavoriteStatus: (song) => ipcRenderer.invoke("getFavoriteStatus", song),

    isSongInAnyPlaylist: (songId) => ipcRenderer.invoke("isSongInAnyPlaylist", songId),

    setRepeatMode: (mode) => ipcRenderer.invoke("setRepeatMode", mode),

    getRepeatMode: () => ipcRenderer.invoke("getRepeatMode"),

    addSongsToQueue: (songIdsOrRows) => ipcRenderer.invoke("addSongsToQueue", songIdsOrRows),

    setSyncWatch: (value) => ipcRenderer.invoke("set-sync-watch", value),
    getSyncWatch: () => ipcRenderer.invoke("get-sync-watch"),

    setHideBars: (value) => ipcRenderer.invoke("set-hide-bars", value),
    getHideBars: () => ipcRenderer.invoke("get-hide-bars"),

    getMaxVolume: () => ipcRenderer.invoke("get-max-volume"),
    setMaxVolume: (value) => ipcRenderer.invoke("set-max-volume", value),

    hardReload: () => ipcRenderer.send("hard-reload"),
    openDevTools: () => ipcRenderer.send("open-devtools"),

    openDataFolder: () => ipcRenderer.invoke('open-data-folder'),

    getSongLibrarySort: () => ipcRenderer.invoke("get-song-library-sort"),
    setSongLibrarySort: (sortKey) => ipcRenderer.invoke("set-song-library-sort", sortKey),

    getPlaylistsSort: () => ipcRenderer.invoke("get-playlists-sort"),
    setPlaylistsSort: (sortKey) => ipcRenderer.invoke("set-playlists-sort", sortKey),

    getCategorySongsSort: () => ipcRenderer.invoke("get-category-sort"),
    setCategorySongsSort: (sortKey) => ipcRenderer.invoke("set-category-sort", sortKey),

    getPlaylistSongsSort: () => ipcRenderer.invoke("get-playlist-songs-sort"),
    setPlaylistSongsSort: (sortKey) => ipcRenderer.invoke("set-playlist-songs-sort", sortKey),

    getFolderSongsSort: () => ipcRenderer.invoke("get-folder-songs-sort"),
    setFolderSongsSort: (sortKey) => ipcRenderer.invoke("set-folder-songs-sort", sortKey),

    getFileInfo: (filePath) => ipcRenderer.invoke("getFileInfo", filePath),
    
    getVideoFileInfo: (path) => ipcRenderer.invoke("get-video-file-info", path)
});