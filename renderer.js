const mediaCurrentTime = document.getElementById('mediaCurrentTime');
const mediaTotalTime = document.getElementById('mediaTotalTime');

const audioControl = document.getElementById('audio');
const canvas = document.getElementById('waveformCanvas');
const ctx = canvas.getContext('2d');
const playPauseBtn = document.getElementById('playPauseBtn');
const nextBtnDiv = document.getElementById('nextBtnDiv');
const prevBtnDiv = document.getElementById('prevBtnDiv');
const audio = document.getElementById('audio');

const timeTooltip = document.getElementById('waveformTimeTooltip');

const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');

let waveformData = [];
let isPlaying = false;

let isMouseOver = false;
let mouseX = 0;

let playingSong = null;

let currentSongId = null;

let lastVisiblePage = null;

let currentSongList = []; // stores the list currently being viewed (library / artist / album / genre)

let currentOpenedPlaylist = {
  id: null,
  name: null
};

let mediaCtxTarget = null; 
let mediaCtxType = null;   // "artist" | "album" | "genre"

let currentAAGType = null;     // "artist" | "album" | "genre"
let currentAAGId = null;
let currentAAGName = "";
let currentAAGSongs = [];

const homeSideBtn = document.getElementById('homeSideBtn');
const searchSideBtn = document.getElementById('searchSideBtn');
const songsSideBtn = document.getElementById('songsSideBtn');
const playlistsSideBtn = document.getElementById('playlistsSideBtn');
const videosSideBtn = document.getElementById('videosSideBtn');

const artistsSideBtn = document.getElementById('artistsSideBtn');
const albumsSideBtn = document.getElementById('albumsSideBtn');
const genresSideBtn = document.getElementById('genresSideBtn');

//window.addEventListener('DOMContentLoaded', loadHomePage);
loadHomePage();

const songNameDiv = document.getElementById('songNameDiv');
const artistNameDiv = document.getElementById('artistNameDiv');
const albumNameDiv = document.getElementById('albumNameDiv');

const repeatBtnDiv = document.getElementById('repeatBtnDiv');
const shuffleBtnDiv = document.getElementById('shuffleBtnDiv');
const addFavBtnDiv = document.getElementById('addFavBtnDiv');
const volumeBtnDiv = document.getElementById('volumeBtnDiv');
const addToPlaylistBtnDiv = document.getElementById('addToPlaylistBtnDiv');

const menubarTitle = document.getElementById('menubarTitle');

const playBarAlbumCover = document.getElementById('playBarAlbumCover');

const shufflePlayBtnSongList = document.getElementById('shufflePlayBtnSongList');
const shuffleAndPlayBtnCategory = document.getElementById('shuffleAndPlayBtnCategory');
const shuffleAndPlayBtnPlaylist = document.getElementById('shuffleAndPlayBtnPlaylist');
const shuffleAndPlayBtnFolder = document.getElementById('shuffleAndPlayBtnFolder');

const playAllBtnSongList = document.getElementById('playAllBtnSongList');
const playAllBtnCategory = document.getElementById('playAllBtnCategory');
const playAllBtnPlaylist = document.getElementById('playAllBtnPlaylist');
const playAllBtnFolder = document.getElementById('playAllBtnFolder');

const editBtn = document.getElementById('editPlaylistBtn');
const deleteBtn = document.getElementById('deletePlaylistBtn');

const videoDotDiv = document.getElementById('videoDotDiv');

const addToQueueBtn = document.getElementById('addToQueueBtn');
const editPlaylistBtn = document.getElementById('editPlaylistBtn');

const infoBtnDiv = document.getElementById('infoBtnDiv');

// FILLED HEART SYMBOL
const noFavorite = `
<div class="mediaControlsTiny">
  <svg class="mediaSvg" viewBox="0 -960 960 960">
      <path d="M480-142.33q-11.8 0-24.02-4.25-12.22-4.25-21.49-13.59l-58.16-53.5q-118-109-207.16-210.5Q80-525.67 80-640q0-91.44 61.33-152.72 61.34-61.28 152-61.28Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.28Q880-731.44 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9.16 9.25-21.25 13.46-12.08 4.21-24.08 4.21Zm-30-543q-27.67-46.34-68-74.17t-88.67-27.83q-64 0-105.33 41.66-41.33 41.67-41.33 105.96 0 55.71 38.25 117.65 38.25 61.93 91.5 120.16T386.5-293.33q56.83 50.33 93.5 84 36.67-33 93.5-83.67t110-109.33Q736.67-461 775-522.96q38.33-61.96 38.33-117.04 0-64-41.66-105.67-41.67-41.66-105-41.66-49 0-89 27.5t-69 74.5q-5.67 8.66-13 12.66-7.34 4-16.34 4t-16.66-4q-7.67-4-12.67-12.66Zm30 187Z"/>
  </svg>
</div>
`;
const favorited = `
<div class="mediaControlsTiny">
  <svg class="mediaSvg" viewBox="0 -960 960 960">
      <path d="M480-142.33q-12 0-24.17-4.34Q443.67-151 434.67-160l-58.34-53.67q-118-109-207.16-210.5Q80-525.67 80-640q0-91.33 61.33-152.67 61.34-61.33 152-61.33Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.33Q880-731.33 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9 9-21.16 13.33-12.17 4.34-24.17 4.34Z"/>
  </svg>
</div>
`;
const shuffleOff = `
<div class="mediaControlsTiny">
  <svg class="mediaSvg" viewBox="0 -960 960 960">
      <path d="M753-612H153.33q-14.33 0-23.83-9.5-9.5-9.5-9.5-23.83 0-14.34 9.5-23.84t23.83-9.5H753L661.67-770q-10-10-9.84-23.33.17-13.34 10.17-23.34 10-9.66 23.33-9.83 13.34-.17 23.34 9.83l148 148q5.33 5.34 7.5 11 2.16 5.67 2.16 12.34 0 6.66-2.16 12.33-2.17 5.67-7.5 11L709.33-474.67q-9.66 9.67-23.16 9.67t-23.5-9.67q-10-10-10-23.5t10-23.5L753-612Z"/>
      <g transform="scale(-1,1) translate(-960,100)">
          <path d="M207-280.67 297.67-190q10 10 9.83 23.33-.17 13.34-10.17 23.34-10 9.66-23.33 9.83-13.33.17-23.33-9.83L103.33-290.67q-5.33-5.33-7.5-11-2.16-5.66-2.16-12.33t2.16-12.33q2.17-5.67 7.5-11l148-148Q261-495 274.5-495q13.5 0 23.5 9.67 10 10 10 23.5t-10 23.5l-91 91h599.67q14.33 0 23.83 9.5 9.5 9.5 9.5 23.83 0 14.33-9.5 23.83-9.5 9.5-23.83 9.5H207Z"/>
      </g>
  </svg>
</div>
`;
const shuffleOn = `
<div class="mediaControlsTiny">
  <svg class="mediaSvg" viewBox="0 -960 960 960">
      <path d="M604-160q-14.17 0-23.75-9.62-9.58-9.61-9.58-23.83 0-14.22 9.58-23.72 9.58-9.5 23.75-9.5h81.33L550.33-361q-10-10-9.83-23.5.17-13.5 10.17-23.5t23.83-10.33q13.83-.34 23.83 9.66l135 134.67v-81.33q0-14.17 9.62-23.75 9.62-9.59 23.83-9.59 14.22 0 23.72 9.59 9.5 9.58 9.5 23.75v162q0 14.16-9.58 23.75-9.59 9.58-23.75 9.58H604Zm-433.33-10.67Q161-180.33 161-194q0-13.67 9.67-23.33l516-516H604q-14.17 0-23.75-9.62t-9.58-23.83q0-14.22 9.58-23.72 9.58-9.5 23.75-9.5h162.67q14.16 0 23.75 9.58 9.58 9.59 9.58 23.75v162q0 14.17-9.62 23.75-9.61 9.59-23.83 9.59-14.22 0-23.72-9.59-9.5-9.58-9.5-23.75V-686l-516 516q-9.66 9.67-23.33 9.33-13.67-.33-23.33-10Zm-1-572.66Q160-753 160-767q0-14 9.67-23.67 9.66-9.66 23.23-9.66t23.43 9.66L409-598.33q9.67 9.66 10.17 23.23t-9.5 23.43Q400-542 386-542q-14 0-23.67-9.67L169.67-743.33Z"/>
  </svg>
</div>
`;
const repeatPlaylist2 = `
<svg class="mediaSvg" viewBox="0 -960 960 960">
    <path d="M480-80q-75 0-140.5-28.17-65.5-28.16-114.33-77-48.84-48.83-77-114.33Q120-365 120-440q0-14.33 9.5-23.83 9.5-9.5 23.83-9.5 14.34 0 23.84 9.5t9.5 23.83q0 122.33 85.5 207.83 85.5 85.5 207.83 85.5 122.33 0 207.83-85.5 85.5-85.5 85.5-207.83 0-122.33-83.83-207.83-83.83-85.5-206.17-85.5h-16.66l46 46q10 10 9.83 23.33-.17 13.33-9.83 23.33-10 10-23.5 10.17-13.5.17-23.5-9.83L361.33-744.67q-10-10-10-23.33 0-13.33 10-23.33l105-105q9.34-9.34 23.17-9.17 13.83.17 23.17 9.5 9 9.33 9.16 23 .17 13.67-9.16 23l-50 50H480q75 0 140.5 28.17 65.5 28.16 114.33 77 48.84 48.83 77 114.33Q840-515 840-440t-28.17 140.5q-28.16 65.5-77 114.33-48.83 48.84-114.33 77Q555-80 480-80Z"/>
</svg>
`;
const noRepeat = `
<div class="mediaControlsTiny">
  <svg class="mediaSvg" viewBox="0 -960 960 960">
      <path d="m480-433.33 124.67 124.66Q614.33-299 628-299q13.67 0 23.33-9.67Q661-318.33 661-332q0-13.67-9.67-23.33L526.67-480l124.66-124.67Q661-614.33 661-628q0-13.67-9.67-23.33Q641.67-661 628-661q-13.67 0-23.33 9.67L480-526.67 355.33-651.33Q345.67-661 332-661q-13.67 0-23.33 9.67Q299-641.67 299-628q0 13.67 9.67 23.33L433.33-480 308.67-355.33Q299-345.67 299-332q0 13.67 9.67 23.33Q318.33-299 332-299q13.67 0 23.33-9.67L480-433.33ZM480-80q-82.33 0-155.33-31.5-73-31.5-127.34-85.83Q143-251.67 111.5-324.67T80-480q0-83 31.5-156t85.83-127q54.34-54 127.34-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82.33-31.5 155.33-31.5 73-85.5 127.34Q709-143 636-111.5T480-80Zm0-66.67q139.33 0 236.33-97.33t97-236q0-139.33-97-236.33t-236.33-97q-138.67 0-236 97-97.33 97-97.33 236.33 0 138.67 97.33 236 97.33 97.33 236 97.33ZM480-480Z"/>
  </svg>
</div>
`;
const repeatSong = `
<div class="mediaControlsSmaller1">
  <svg class="mediaSvg" viewBox="0 0 30 30">
      <g transform="translate(0,-289.0625)">
          <path
          d="M 15 3 L 15 6 C 10.041282 6 6 10.04128 6 15 C 6 19.95872 10.041282 24 15 24 C 19.958718 24 24 19.95872 24 15 C 24 13.029943 23.355254 11.209156 22.275391 9.7246094 L 20.849609 11.150391 C 21.575382 12.253869 22 13.575008 22 15 C 22 18.87784 18.877838 22 15 22 C 11.122162 22 8 18.87784 8 15 C 8 11.12216 11.122162 8 15 8 L 15 11 L 20 7 L 15 3 z "
          transform="translate(0,289.0625)"/>
          <path d="m 16.626787,307.04272 h -1.366678 v -4.60261 l -1.278505,0.78473 -0.608392,-0.92581 2.010339,-1.21678 h 1.243236 z"/>
      </g>
  </svg>
</div>
`;
const repeatPlaylist = `
<div class="mediaControlsSmaller1">
  <svg class="mediaSvg" viewBox="0 0 30 30">
      <g transform="translate(0,-289.0625)">
          <path
          d="M 15 3 L 15 6 C 10.041282 6 6 10.04128 6 15 C 6 19.95872 10.041282 24 15 24 C 19.958718 24 24 19.95872 24 15 C 24 13.029943 23.355254 11.209156 22.275391 9.7246094 L 20.849609 11.150391 C 21.575382 12.253869 22 13.575008 22 15 C 22 18.87784 18.877838 22 15 22 C 11.122162 22 8 18.87784 8 15 C 8 11.12216 11.122162 8 15 8 L 15 11 L 20 7 L 15 3 z "
          transform="translate(0,289.0625)"
          id="path852" />
      </g>
  </svg>
</div>
`;

const volumeMax = `
<div class="mediaControlsTiny">
  <svg class="mediaSvg" viewBox="0 -960 960 960">
      <path d="M773.33-481q0-90.33-49.66-163.17Q674-717 592.67-751q-13-5.67-18.67-17.83-5.67-12.17-.67-24.5 5.34-13.34 18.84-18.67 13.5-5.33 27.5.33 99.66 41.67 160 131.17Q840-591 840-481t-60.33 199.5q-60.34 89.5-160 131.17-14 5.66-27.5.33t-18.84-18.67q-5-12.33.67-24.5 5.67-12.16 18.67-17.83 81.33-34 131-106.83 49.66-72.84 49.66-163.17ZM280-360H153.33q-14.33 0-23.83-9.5-9.5-9.5-9.5-23.83v-173.34q0-14.33 9.5-23.83 9.5-9.5 23.83-9.5H280l143.33-143.33Q439-759 459.5-750.5t20.5 30.83v479.34q0 22.33-20.5 30.83t-36.17-7.17L280-360Zm380-120q0 48.67-23.67 89.17-23.66 40.5-65.33 63.16-8.67 4.67-16.5-.5-7.83-5.16-7.83-14.5v-276q0-9.33 7.83-14.5 7.83-5.16 16.5-.5 41.67 23 65.33 64.34Q660-528 660-480Z"/>
  </svg>
</div>
`;
const volumeLow = `
<div class="mediaControlsTiny">
  <svg class="mediaSvg" viewBox="0 -960 960 960">
      <path d="M360-360H233.33q-14.33 0-23.83-9.5-9.5-9.5-9.5-23.83v-173.34q0-14.33 9.5-23.83 9.5-9.5 23.83-9.5H360l143.33-143.33Q519-759 539.5-750.5t20.5 30.83v479.34q0 22.33-20.5 30.83t-36.17-7.17L360-360Zm380-120q0 48.67-23.67 89.17-23.66 40.5-65.33 63.16-8.67 4.67-16.5-.5-7.83-5.16-7.83-14.5v-276q0-9.33 7.83-14.5 7.83-5.16 16.5-.5 41.67 23 65.33 64.34Q740-528 740-480Z"/>
  </svg>
</div>
`;
const volumeLowest = `
<div class="mediaControlsTiny">
  <svg class="mediaSvg" viewBox="0 -960 960 960">
      <path d="M440-360H313.33q-14.33 0-23.83-9.5-9.5-9.5-9.5-23.83v-173.34q0-14.33 9.5-23.83 9.5-9.5 23.83-9.5H440l143.33-143.33Q599-759 619.5-750.5t20.5 30.83v479.34q0 22.33-20.5 30.83t-36.17-7.17L440-360Z"/>
  </svg>
</div>
`;
const volumeMute = `
<div class="mediaControlsTiny">
  <svg class="mediaSvg" viewBox="0 -960 960 960">
      <path d="M677.67-184.33q-15 10.33-31 19-16 8.66-33.34 15.66-13 5.67-26.5 0-13.5-5.66-18.83-19-5.33-12.33.83-24.5Q575-205.33 588-211q11.33-4 21.5-9.33 10.17-5.34 20.17-12.67L475.33-387.33v147q0 22.33-20.5 30.83t-36.16-7.17L275.33-360H148.67q-14.34 0-23.84-9.5t-9.5-23.83v-173.34q0-14.33 9.5-23.83 9.5-9.5 23.84-9.5H262L74.67-787.33Q65-797 65.33-811q.34-14 10-23.67Q85-844.33 99-844.33q14 0 23.67 9.66L830-127.33q9.67 9.66 9.67 23.66T830-80q-9.67 9.67-24 9.67T782-80L677.67-184.33Zm91-296.67q0-89.67-49.67-162.83Q669.33-717 588-751q-13-5.67-18.67-17.83-5.66-12.17-.66-24.5Q574-806.67 587.5-812q13.5-5.33 27.5.33Q714.67-770 775-681q60.33 89 60.33 200 0 36.33-7 71.83T807-340.33q-8 18.66-21.17 22.83-13.16 4.17-25.16-.83T742.17-334q-6.5-10.67.16-23.67 13.67-28.66 20-59.5 6.34-30.83 6.34-63.83ZM581-626.33Q617.33-604 636.33-563t19 83v13.33q0 6.34-1.66 13.34-2 11-12 14.33T623-444.33L565.33-502q-5.33-5.33-7.66-11.17-2.34-5.83-2.34-12.5V-612q0-10 8.5-14.83 8.5-4.84 17.17.5ZM383.33-684q-5.33-5.33-5.33-12t5.33-12l35.34-35.33q15.66-15.67 36.16-7.17 20.5 8.5 20.5 30.83V-632q0 11.33-10.33 15.33t-18.33-4L383.33-684Z"/>
  </svg>
</div>
`;

const addToPlaylist = `
<div class="mediaControlsTiny">
    <svg class="mediaSvg" viewBox="0 -960 960 960">
        <path d="M448.67-444v130.67q0 14.16 9.61 23.75 9.62 9.58 23.84 9.58 14.21 0 23.71-9.58 9.5-9.59 9.5-23.75V-444h131.34q14.16 0 23.75-9.62 9.58-9.61 9.58-23.83 0-14.22-9.58-23.72-9.59-9.5-23.75-9.5H515.33v-136q0-14.16-9.61-23.75-9.62-9.58-23.84-9.58-14.21 0-23.71 9.58-9.5 9.59-9.5 23.75v136H313.33q-14.16 0-23.75 9.62-9.58 9.62-9.58 23.83 0 14.22 9.58 23.72 9.59 9.5 23.75 9.5h135.34Zm31.51 364q-82.83 0-155.67-31.5-72.84-31.5-127.18-85.83Q143-251.67 111.5-324.56T80-480.33q0-82.88 31.5-155.78Q143-709 197.33-763q54.34-54 127.23-85.5T480.33-880q82.88 0 155.78 31.5Q709-817 763-763t85.5 127Q880-563 880-480.18q0 82.83-31.5 155.67Q817-251.67 763-197.46q-54 54.21-127 85.84Q563-80 480.18-80Zm.15-66.67q139 0 236-97.33t97-236.33q0-139-96.87-236-96.88-97-236.46-97-138.67 0-236 96.87-97.33 96.88-97.33 236.46 0 138.67 97.33 236 97.33 97.33 236.33 97.33ZM480-480Z"/>
    </svg>
</div>
`;
const addToPlaylistCheck = `
<div class="mediaControlsTiny">
    <svg class="playListCheck" viewBox="0 -960 960 960">
        <path d="m422-395.33-94-94q-9.67-9.67-24-9.67t-24.67 10.33q-9.66 9.67-9.66 24 0 14.34 9.66 24l119.34 120q10 10 23.33 10 13.33 0 23.33-10L680-555.33q10.33-10.34 10.33-24.67 0-14.33-10.33-24.67-10.33-9.66-25-9.33-14.67.33-24.33 10L422-395.33ZM480-80q-82.33 0-155.33-31.5-73-31.5-127.34-85.83Q143-251.67 111.5-324.67T80-480q0-83 31.5-156t85.83-127q54.34-54 127.34-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82.33-31.5 155.33-31.5 73-85.5 127.34Q709-143 636-111.5T480-80Zm0-66.67q139.33 0 236.33-97.33t97-236q0-139.33-97-236.33t-236.33-97q-138.67 0-236 97-97.33 97-97.33 236.33 0 138.67 97.33 236 97.33 97.33 236 97.33ZM480-480Z"/>
    </svg>
</div>
`;

let repeatMode = 1; 
let shuffle = 0;
let favoriteStatus = 0;
let addedToPlaylistStatus = 0;

const backToFolderBtn = document.getElementById('backToFolderBtn');
const foldersSideBtn = document.getElementById('foldersSideBtn');

backToFolderBtn.addEventListener('click', () => {
  foldersSideBtn.click();
});

addToPlaylistBtnDiv.addEventListener("click", () => {
    if (!currentSongId) return;
    // Always open the dialog
    openAddSongToPlaylistDialog(currentSongId);
});

async function updateAddToPlaylistIcon(songId) {
  const isInside = await window.electronAPI.isSongInAnyPlaylist(songId);
  addedToPlaylistStatus = isInside ? 1 : 0;
  addToPlaylistBtnDiv.innerHTML = isInside ? addToPlaylistCheck : addToPlaylist;
  // Change hover tooltip (THIS IS WHAT YOU ASKED FOR)
  addToPlaylistBtnDiv.title = isInside ? "In a Playlist" : "Add to Playlist";
}

addFavBtnDiv.addEventListener('click', async () => {
    if (!currentSongId) return;
    favoriteStatus = (favoriteStatus + 1) % 2;
    const isFav = favoriteStatus === 1;
    // Update backend
    const result = await window.electronAPI.setSongFavorite(currentSongId, isFav ? 1 : 0);
    if (result?.success) {
      const title = result.row.title;
      if (isFav) {
        showErrorMsg("info", `Added to Favorites: ${title}`);
      } else {
        showErrorMsg("info", `Removed from Favorites: ${title}`);
      }
    }
    // Update icon
    addFavBtnDiv.innerHTML = isFav ? favorited : noFavorite;
    // 🔥 FIX: Update tooltip here
    addFavBtnDiv.title = isFav 
        ? "Remove from Favorites" 
        : "Add to Favorites";
    // Update all lists visually
    updateFavoriteIcon(currentSongId, isFav);
});

function setPlaybarFavorite(isFav) {
    favoriteStatus = isFav ? 1 : 0;

    // Swap icon
    addFavBtnDiv.innerHTML = isFav ? favorited : noFavorite;

    // Update style + tooltip
    if (isFav) {
        addFavBtnDiv.classList.add("fav");
        addFavBtnDiv.title = "Remove from Favorites";
    }
     else {
        addFavBtnDiv.classList.remove("fav");
        addFavBtnDiv.title = "Add to Favorites";
    }
}

shuffleBtnDiv.addEventListener("click", async () => {
  const q = await window.electronAPI.toggleShuffle();
  // Update UI queue panel
  updateQueuePanel(q);
  // Toggle CSS state
  shuffleBtnDiv.classList.toggle("active", q.shuffle);
  // Update SVG icon based on shuffle state
  if (q.shuffle) { shuffleBtnDiv.innerHTML = shuffleOn; } 
  else { shuffleBtnDiv.innerHTML = shuffleOff; }
});

repeatBtnDiv.addEventListener('click', async () => {
  repeatMode = (repeatMode + 1) % 3;
  switch (repeatMode) {
    case 0:
        repeatBtnDiv.innerHTML = repeatPlaylist;
        repeatBtnDiv.title = "Repeat Playing Queue";
        break;
    case 1:
        repeatBtnDiv.innerHTML = repeatSong;
        repeatBtnDiv.title = "Repeat Current Song";
        break;
    case 2:
        repeatBtnDiv.innerHTML = noRepeat;
        repeatBtnDiv.title = "No Repeat";
        break;
  }
  // Save to backend
  await window.electronAPI.setRepeatMode(repeatMode);
});

async function loadRepeatMode() {
  repeatMode = await window.electronAPI.getRepeatMode();

  switch (repeatMode) {
    case 0:
      repeatBtnDiv.innerHTML = repeatPlaylist;
      repeatBtnDiv.title = "Repeat Playing Queue";
      break;
    case 1:
      repeatBtnDiv.innerHTML = repeatSong;
      repeatBtnDiv.title = "Repeat Current Song";
      break;
    case 2:
      repeatBtnDiv.innerHTML = noRepeat;
      repeatBtnDiv.title = "No Repeat";
      break;
  }
}

async function handleSongEnded() {
    // 🔁 Mode 1 → Repeat Current Song
    if (repeatMode === 1) {
        await playCommand(currentSongId, false);
        return;
    }
    // Get current queue
    const queue = await window.electronAPI.getPlayingQueue();
    if (!queue) return;
    const { currentIndex, queue: list } = queue;
    const nextIndex = currentIndex + 1;

    // 🔁 Mode 0 → Repeat Playlist
    if (repeatMode === 0) {
        // If reached end, restart from 0
        const indexToPlay = nextIndex >= list.length ? 0 : nextIndex;
        const nextSong = list[indexToPlay];
        await window.electronAPI.setPlayingQueue({
            queue: list,
            currentIndex: indexToPlay
        });
        await playCommand(nextSong.id, false);
        await loadPlayingQueue();
        return;
    }

    // ❌ Mode 2 → No Repeat
    if (repeatMode === 2) {
        // Stop when end reached
        if (nextIndex >= list.length) {
            // No more songs — stop playback
            audio.pause();
            audio.currentTime = 0;
            return;
        }
        // Play next normally
        const nextSong = list[nextIndex];
        await window.electronAPI.setPlayingQueue({
            queue: list,
            currentIndex: nextIndex
        });
        await playCommand(nextSong.id, false);
        await loadPlayingQueue();
        return;
    }
}

// Mouse event listeners
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseenter', handleMouseEnter);
canvas.addEventListener('mouseleave', handleMouseLeave);
canvas.addEventListener('click', handleCanvasClick);

function handleMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const parentRect = timeTooltip.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  // Convert mouse X to canvas pixel space
  mouseX = (e.clientX - rect.left) * dpr;
  isMouseOver = true;

  if (audio.src && waveformData.length > 0) {
    const width = rect.width;
    const hoverPercentage = Math.min(Math.max(mouseX / width, 0), 1);
    const hoverTime = audio.duration * hoverPercentage;
    timeTooltip.style.display = 'block';
    timeTooltip.style.left = (e.clientX - parentRect.left) + 'px';
    timeTooltip.style.top = (rect.top - parentRect.top - 25) + 'px';
    timeTooltip.textContent = formatTime(hoverTime);
  }

  if (waveformData.length > 0) {
    drawWaveform(waveformData, audio.currentTime / audio.duration);
  }
}

function handleMouseLeave() {
  isMouseOver = false;
  timeTooltip.style.display = 'none';
  
  // Redraw to hide the hover line
  if (waveformData.length > 0) {
      drawWaveform(waveformData, audio.currentTime / audio.duration);
  }
}

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

function handleMouseEnter() {
    isMouseOver = true;
}

function handleCanvasClick(e) {
    if (!audio.src || waveformData.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickPercentage = clickX / width;
    const progress = Math.min(Math.max(clickX / rect.width, 0), 1);
    drawWaveform(waveformData, progress);
    // Jump to the clicked position
    audio.currentTime = audio.duration * clickPercentage;
    // Update playback immediately
    if (isPlaying) {
        audio.play(); // Restart play from new position
    }
}

const addFileMenuBtn = document.getElementById('addFileMenuBtn');
const fileInput = document.getElementById('fileInput');

addFileMenuBtn.addEventListener('click', () => {
  fileInput.click();
});

playPauseBtn.addEventListener("click", async () => {
  // If there is no source loaded
  if (!audio.src) {
    // Try to resume from the saved queue
    const queueData = await window.electronAPI.getPlayingQueue();

    if (queueData?.currentSong) {
      const song = queueData.currentSong;
      currentSongId = song.id;
      playingSong = song;

      // Load metadata into UI
      playBarAlbumCover.src = song.albumArt || "images/albumph.png";
      songNameDiv.innerText = song.title;
      artistNameDiv.innerText = song.artist;
      albumNameDiv.innerText = song.albumName;

      // Actually start playing the song
      await playCommand(song.id, false);
      return;
    } 
    else {
      console.log("⚠️ No song in queue to play");
      return;
    }
  }

  // Toggle play/pause
  if (isPlaying) {
    pauseIcon.classList.remove("active");
    playIcon.classList.add("active");
    audio.pause();
  } 
  else {
    playIcon.classList.remove("active");
    pauseIcon.classList.add("active");
    audio.play();

    // Refresh song info when resuming
    if (playingSong) {
      songNameDiv.innerText = playingSong.title;
      artistNameDiv.innerText = playingSong.artist;
      albumNameDiv.innerText = playingSong.album;
    }
  }

  isPlaying = !isPlaying;

  // Update playback state to backend
  window.electronAPI.updatePlaybackState({
    isPlaying,
    currentTime: audio.currentTime,
    duration: audio.duration,
    title: playingSong?.title || "",
    artist: playingSong?.artist || "",
  });
  
});

nextBtnDiv.addEventListener("click", async () => {
  const nextSong = await window.electronAPI.playNextInQueue();
  if (nextSong) await playCommand(nextSong.id);
});

prevBtnDiv.addEventListener("click", async () => {
  const prevSong = await window.electronAPI.playPreviousInQueue();
  if (prevSong) await playCommand(prevSong.id);
});

async function playCommand(songId, sourceList = null) {
  fileInput.value = "";
  playingSong = null;

  try {
    // Stop current playback
    if (isPlaying && audio) {
      audio.pause();
      audio.currentTime = 0;
      isPlaying = false;
    }

    // Fetch song
    const songFromDB = await window.electronAPI.getSongById(songId);
    if (!songFromDB) return;

    currentSongId = songId;

    const songMetadata = {
      id: songFromDB.id,
      title: songFromDB.title,
      artist: songFromDB.artist,
      album: songFromDB.albumName,
      year: songFromDB.year,
      cover: songFromDB.albumArt,
      filePath: songFromDB.filePath,
      duration: songFromDB.duration
    };

    // Decode waveform
    const nodeBuffer = await window.electronAPI.getSongBuffer(songFromDB.filePath);
    if (!nodeBuffer) return console.error("Failed to get audio buffer");

    const arrayBuffer = nodeBuffer.buffer.slice(
      nodeBuffer.byteOffset,
      nodeBuffer.byteOffset + nodeBuffer.byteLength
    );

    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    waveformData = extractWaveform(audioBuffer);
    drawWaveform(waveformData);

    // Play audio
    audio.src = window.electronAPI.toURL(songFromDB.filePath);
    audio.load();
    await audio.play();
    isPlaying = true;

    await window.electronAPI.incrementPlayCounter(songId);

    // Favorite state
    if (typeof songFromDB.isFavorite !== "undefined") {
      setPlaybarFavorite(!!songFromDB.isFavorite);
    }

    // UI updates
    playBarAlbumCover.classList.remove("hidden");
    playBarAlbumCover.src = songFromDB.albumArt || "images/albumph.png";
    songNameDiv.innerText = songFromDB.title;
    artistNameDiv.innerText = songFromDB.artist;
    albumNameDiv.innerText = songFromDB.albumName;

    playIcon.classList.remove("active");
    pauseIcon.classList.add("active");

    playingSong = songMetadata;

    let queueData;

    // =========================
    // QUEUE LOGIC (FIXED)
    // =========================

    if (Array.isArray(sourceList) && sourceList.length) {
      // Build new queue from provided list
      const songIndex = sourceList.findIndex(s => String(s.id) === String(songId));
      if (songIndex === -1) return;

      const fullQueue = [];
      for (const item of sourceList.slice(songIndex)) {
        const fullSong = await window.electronAPI.getSongById(item.id);
        if (fullSong) fullQueue.push(fullSong);
      }

      queueData = {
        currentIndex: 0,
        currentSong: fullQueue[0],
        queue: fullQueue
      };

      await window.electronAPI.setPlayingQueue(queueData);
    } else {
      // Reuse existing queue
      queueData = await window.electronAPI.getPlayingQueue();

      if (queueData?.queue?.length) {
        const newIndex = queueData.queue.findIndex(
          s => String(s.id) === String(songId)
        );

        if (newIndex !== -1) {
          queueData.currentIndex = newIndex;
          queueData.currentSong = queueData.queue[newIndex];
          await window.electronAPI.setPlayingQueue(queueData);
        }
      } else {
        // Fallback: single-song queue
        await window.electronAPI.setPlayingQueue({
          currentIndex: 0,
          currentSong: songMetadata,
          queue: [songMetadata]
        });
      }
    }

    highlightCurrentSong(songId);
  } 
  catch (err) {
    console.error("Error playCommand:", err);
  }
}


function highlightCurrentSong(songId) {
  document.querySelectorAll('.playlist-item').forEach(item => {
    item.classList.toggle('current', String(item.dataset.id) === String(songId));
  });

  // scroll the current item into view
  const cur = document.getElementById(`playlist-item-${songId}`);
  if (cur) cur.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// When song ends, revert to play icon
audio.addEventListener('ended', async () => {
  pauseIcon.classList.remove('active');
  playIcon.classList.add('active');
  isPlaying = false;
  mediaCurrentTime.innerText = '00:00';

  // Reset waveform to start position
  if (waveformData.length > 0) {
    drawWaveform(waveformData, 0);
  } 
  else { clearCanvas(); }

  // Hide tooltip
  timeTooltip.style.display = 'none';

  audio.currentTime = 0;
  currentTime = 0;
  duration = audio.duration;

  title = playingSong.title;
  artist = playingSong.artist;

  window.electronAPI.updatePlaybackState({
    isPlaying,
    currentTime,
    duration,
    title,
    artist
  });

  // 1️⃣ Repeat current song
  if (repeatMode === 1) {
    await playCommand(currentSongId, null);
    return;
  }

  // Get queue
  const queueData = await window.electronAPI.getPlayingQueue();
  if (!queueData || !queueData.queue || queueData.queue.length === 0) return;

  const list = queueData.queue;
  const index = queueData.currentIndex;
  const nextIndex = index + 1;

  // 2️⃣ Repeat playlist (when queue ends, restart)
  if (repeatMode === 0) {
    let indexToPlay = nextIndex;

    // Rewind to first song if end reached
    if (nextIndex >= list.length) {
      indexToPlay = 0;
    }

    const nextSong = list[indexToPlay];

    await window.electronAPI.setPlayingQueue({
      queue: list,
      currentIndex: indexToPlay
    });

    await playCommand(nextSong.id, null);
    await loadPlayingQueue();
    return;
  }

  // 3️⃣ No Repeat mode
  if (repeatMode === 2) {

    // End reached → stop playback completely
    if (nextIndex >= list.length) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    // Otherwise play next normally
    const nextSong = list[nextIndex];

    await window.electronAPI.setPlayingQueue({
      queue: list,
      currentIndex: nextIndex
    });

    await playCommand(nextSong.id, null);
    await loadPlayingQueue();
    return;
  }
});

function clearCanvas() {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

audio.addEventListener('play', () => { 
  isPlaying = true; 
});

audio.addEventListener('pause', () => { 
  isPlaying = false; 
});

audio.addEventListener('timeupdate', () => { 
  if (!isPlaying || audio.ended || !audio.duration) return;
  updateTimeStamps();
  drawWaveform(waveformData, audio.currentTime / audio.duration);

  currentTime = audio.currentTime;
  duration = audio.duration;
  title = playingSong.title;
  artist = playingSong.artist;
  window.electronAPI.updatePlaybackState({ isPlaying, currentTime, duration, title, artist });
});

[
  'play', 'pause', 'ended', 'seeked', 'seeking',
  'ratechange', 'stalled', 'suspend', 'waiting',
  'error', 'abort', 'emptied'
].forEach(evt => {
  audio.addEventListener(evt, () => { 
    // Skip updates if audio is not ready
    if (!audio.duration || isNaN(audio.duration)) return;

    const currentTime = audio.currentTime;
    const duration = audio.duration;
    const title = playingSong?.title || '';
    const artist = playingSong?.artist || '';

    // Update isPlaying flag based on current event
    const playingEvents = ['play', 'ratechange'];
    const pausingEvents = ['pause', 'ended'];

    if (playingEvents.includes(evt)) isPlaying = true;
    if (pausingEvents.includes(evt)) isPlaying = false;

    window.electronAPI.updatePlaybackState({
      isPlaying,
      currentTime,
      duration,
      title,
      artist
    });
  });
});

function updateTimeStamps() {
  mediaCurrentTime.innerText = formatTime(audio.currentTime);
  mediaTotalTime.innerText = formatTime(audio.duration);
};

function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }
}

function extractWaveform(audioBuffer, samples = 300) {
  const raw = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(raw.length / samples);
  const waveform = [];
  
  for (let i = 0; i < samples; i++) {
    let sumSquares = 0;
    for (let j = 0; j < blockSize; j++) {
      const value = raw[i * blockSize + j];
      sumSquares += value * value;
    }
    const rms = Math.sqrt(sumSquares / blockSize);
    waveform.push(rms);
  }
  
  // Custom scaling that preserves dynamics
  const maxVal = Math.max(...waveform);
  return waveform.map(val => {
    const normalized = val / maxVal;
    // Custom curve: gentle for low/medium, stronger for high values
    if (normalized < 0.3) return normalized * 0.8;    // Reduce quiet parts
    else if (normalized < 0.7) return normalized * 1.1; // Slight boost for medium
    else return normalized * 1.3;                      // Boost loud parts
  });
}

// -=-=-=-=-=-=SMOTH NO BARS WAVE-=-=-=--==---=--
function drawWaveform(data, progress = 0) {
  setupCanvas();
  
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const middle = height / 2;
  
  ctx.clearRect(0, 0, width, height);
  
  // Draw background
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, width, height);
  
  const barWidth = width / data.length;
  const progressWidth = width * progress;
  
  // Draw the entire waveform as unplayed (gray) first
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.moveTo(0, middle);
  
  // Draw top half of waveform
  for (let i = 0; i < data.length; i++) {
      const x = i * barWidth;
      const barHeight = Math.max(1, data[i] * height * 0.6);
      ctx.lineTo(x, middle - barHeight / 2);
  }
  
  // Draw bottom half of waveform (in reverse)
  for (let i = data.length - 1; i >= 0; i--) {
      const x = i * barWidth;
      const barHeight = Math.max(1, data[i] * height * 0.6);
      ctx.lineTo(x, middle + barHeight / 2);
  }
  
  ctx.closePath();
  ctx.fill();
  
  // Draw played portion (green) as a separate continuous shape
  if (progress > 0) {
      ctx.fillStyle = 'rgb(29,185,84)';
      ctx.beginPath();
      ctx.moveTo(0, middle);
      
      // Draw top half up to progress point
      for (let i = 0; i < data.length; i++) {
          const x = i * barWidth;
          if (x > progressWidth) break;
          
          const barHeight = Math.max(1, data[i] * height * 0.6);
          ctx.lineTo(x, middle - barHeight / 2);
      }
      
      // If we didn't reach the end, add the progress point for top
      if (progressWidth < width) {
          const progressIndex = progressWidth / barWidth;
          const partialProgress = progressIndex - Math.floor(progressIndex);
          const currentBarHeight = data[Math.floor(progressIndex)] * height * 0.6;
          ctx.lineTo(progressWidth, middle - currentBarHeight / 2);
      }
      
      // Draw bottom half back from progress point to start
      if (progressWidth < width) {
          const progressIndex = progressWidth / barWidth;
          const partialProgress = progressIndex - Math.floor(progressIndex);
          const currentBarHeight = data[Math.floor(progressIndex)] * height * 0.6;
          ctx.lineTo(progressWidth, middle + currentBarHeight / 2);
      }
      
      // Draw bottom half in reverse
      for (let i = Math.min(data.length - 1, Math.floor(progressWidth / barWidth)); i >= 0; i--) {
          const x = i * barWidth;
          const barHeight = Math.max(1, data[i] * height * 0.6);
          ctx.lineTo(x, middle + barHeight / 2);
      }
      
      ctx.closePath();
      ctx.fill();
  }
  
  // Draw progress line
  if (progress > 0) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(progressWidth, 0);
      ctx.lineTo(progressWidth, height);
      ctx.stroke();
  }
  
  // Draw hover line
  if (isMouseOver && mouseX >= 0 && mouseX <= width) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(mouseX, 0);
      ctx.lineTo(mouseX, height);
      ctx.stroke();
      ctx.setLineDash([]);
  }
}
/* 
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate extension
  const validExtensions = [
    '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a',
    '.mp4','.webm','.mkv','.mov','.m4v'
  ];

  // const fileExt = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const fileExt = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const isVideo = ['.mp4','.webm','.mkv','.mov','.m4v'].includes(fileExt);
  const isAudio = !isVideo;

  if (!validExtensions.includes(fileExt)) {
    await alertDlg('Unsupported file format!');
    return;
  }

  // Read metadata
  const tags = await readMetadata(file);

  let songMetadata = {
    title: tags?.title || file.name,
    artist: tags?.artist || "Unknown Artist",
    album: tags?.album || "Unknown Album",
    year: tags?.year || "Unknown",
    cover: null
  };

  if (tags?.picture) {
    const { data, format } = tags.picture;
    songMetadata.cover = `data:${format};base64,${arrayBufferToBase64(data)}`;
  }

  playingSong = songMetadata;

  // Audio decode
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  waveformData = extractWaveform(audioBuffer);
  drawWaveform(waveformData);

  // Object URL handling
  if (window.currentLocalObjectUrl) {
    URL.revokeObjectURL(window.currentLocalObjectUrl);
  }

  window.currentLocalObjectUrl = URL.createObjectURL(file);
  audio.src = window.currentLocalObjectUrl;

  audio.addEventListener('loadedmetadata', function onMeta() {

    if (audio.src !== window.currentLocalObjectUrl) return;

    isPlaying = false;
    updateTimeStamps();

    playBarAlbumCover.classList.remove('hidden');
    playBarAlbumCover.src = songMetadata.cover || 'images/albumph.png';
    playIcon.classList.remove('active');
    pauseIcon.classList.add('active');

    songNameDiv.innerText = songMetadata.title;
    artistNameDiv.innerText = songMetadata.artist;
    albumNameDiv.innerText = songMetadata.album;

    audio.play();
    isPlaying = true;

    currentTime = audio.currentTime;
    duration = audio.duration;

    window.electronAPI.updatePlaybackState({
      isPlaying,
      currentTime,
      duration,
      title: songMetadata.title,
      artist: songMetadata.artist
    });

  });

}); */

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const validExtensions = [
    '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a',
    '.mp4','.webm','.mkv','.mov','.m4v'
  ];

  const fileExt = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const isVideo = ['.mp4','.webm','.mkv','.mov','.m4v'].includes(fileExt);

  if (!validExtensions.includes(fileExt)) {
    await alertDlg('Unsupported file format!');
    return;
  }

  // --- VIDEO HANDLING ---------------------------------------------------------
  if (isVideo) {
    const localURL = URL.createObjectURL(file);

    showVideoPlayer();

    video.pause();
    video.removeAttribute("src");
    video.load();

    video.src = localURL;

    video.addEventListener("canplay", function start() {
      video.removeEventListener("canplay", start);
      video.play().catch(err => console.warn("Autoplay failed:", err));
      videoIsPlaying = true;
      videoDotDiv.classList.add("videoDot");

      videoLoaded = true;
      showingVideoPlayer = true;
      videoIsEnded = false;
      lastSection = 'videos';
    });

    // Hide bars when video starts
    const hideBars = await window.electronAPI.getHideBars();
    if (hideBars) {
      sideBarDiv.classList.add("collapsed");
      sideBarBtn.classList.remove("active");
      playBarDiv.classList.add("collapsed");
      playlistPanel.classList.add("collapsed");
      updateMiddleMargin();
    }

    return; // prevent running audio pipeline
  }

  // --- AUDIO HANDLING (same as your current code) ------------------------------
  const tags = await readMetadata(file);

  let songMetadata = {
    title: tags?.title || file.name,
    artist: tags?.artist || "Unknown Artist",
    album: tags?.album || "Unknown Album",
    year: tags?.year || "Unknown",
    cover: null
  };

  if (tags?.picture) {
    const { data, format } = tags.picture;
    songMetadata.cover = `data:${format};base64,${arrayBufferToBase64(data)}`;
  }

  playingSong = songMetadata;

  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  waveformData = extractWaveform(audioBuffer);
  drawWaveform(waveformData);

  if (window.currentLocalObjectUrl) {
    URL.revokeObjectURL(window.currentLocalObjectUrl);
  }

  window.currentLocalObjectUrl = URL.createObjectURL(file);
  audio.src = window.currentLocalObjectUrl;

  audio.addEventListener('loadedmetadata', function onMeta() {
    if (audio.src !== window.currentLocalObjectUrl) return;

    isPlaying = false;
    updateTimeStamps();

    playBarAlbumCover.classList.remove('hidden');
    playBarAlbumCover.src = songMetadata.cover || 'images/albumph.png';
    playIcon.classList.remove('active');
    pauseIcon.classList.add('active');

    songNameDiv.innerText = songMetadata.title;
    artistNameDiv.innerText = songMetadata.artist;
    albumNameDiv.innerText = songMetadata.album;

    audio.play();
    isPlaying = true;

    currentTime = audio.currentTime;
    duration = audio.duration;

    window.electronAPI.updatePlaybackState({
      isPlaying,
      currentTime,
      duration,
      title: songMetadata.title,
      artist: songMetadata.artist
    });
  });

});


function seekBy(seconds) {
  if (!audio || !audio.duration) return;

  const newTime = Math.min(
    Math.max(audio.currentTime + seconds, 0),
    audio.duration
  );

  audio.currentTime = newTime;

  // Keep waveform + UI in sync immediately
  drawWaveform(waveformData, newTime / audio.duration);
  updateTimeStamps();
}

function readMetadata(file) {
  return new Promise((resolve) => {
    window.jsmediatags.read(file, {
      onSuccess: (result) => {
        resolve(result.tags); // returns { title, artist, album, year, picture, ... }
      },
      onError: (error) => {
        console.warn("Metadata read error:", error);
        resolve(null); // return null so caller can fallback safely
      }
    });
  });
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

// Keep sharp on resize
window.addEventListener('resize', () => {
  if (waveformData.length > 0) {
    drawWaveform(waveformData, audio.currentTime / audio.duration);
  }
});

document.getElementById("menu_btn").addEventListener("click", async (e) => {
    await window.electronAPI.openMenu(e.x, e.y);
});
document.getElementById("minimize_btn").addEventListener("click", async () => {
    await window.electronAPI.minimizeWindow();
});
document.getElementById("max_unmax_btn").addEventListener("click", async () => {
    const isMaximized = await window.electronAPI.isWindowMaximized();
    if (isMaximized) {
        document.getElementById('menubar_maximize_icon').classList.remove('hidden');
        document.getElementById('menubar_restore_icon').classList.add('hidden');
    } 
    else {
        document.getElementById('menubar_restore_icon').classList.remove('hidden');
        document.getElementById('menubar_maximize_icon').classList.add('hidden');
    }
    await window.electronAPI.maxUnmaxWindow();
});
document.getElementById("close_btn").addEventListener("click", async () => {
    await window.electronAPI.closeWindow();
});

const pyrusBtnDiv = document.getElementById('pyrusBtnDiv');
const pyrusMenu = document.getElementById('pyrusMenuDiv');

// Toggle menu on button click
pyrusBtnDiv.addEventListener('click', (e) => {
  e.stopPropagation(); // prevent event bubbling
  pyrusMenu.classList.toggle('show');
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (!pyrusMenu.contains(e.target) && !pyrusBtnDiv.contains(e.target)) {
    pyrusMenu.classList.remove('show');
  }
}); 

// -=-=-=-=-=-=-=-=-=-=VOLUME=-=-=-=-=-=-=-=-

const volumeRange = document.getElementById('volumeRange');
const tooltip = document.getElementById('volumeTooltip');

function updateRange() {
  const val = parseFloat(volumeRange.value);
  const percent = val * 100;
  // Update background fill
  volumeRange.style.background = `linear-gradient(to right, rgb(29,185,84) ${percent}%, #d3d3d3 ${percent}%)`;
  // Update tooltip text
  tooltip.textContent = `${Math.round(percent)}%`;
  // Move tooltip along the slider
  const sliderWidth = volumeRange.offsetWidth;
  const tooltipWidth = tooltip.offsetWidth;
  const offset = (percent / 100) * (sliderWidth - 14); // 14 = thumb width
  tooltip.style.left = `${offset + 25 - tooltipWidth / 2}px`; // center tooltip
  // 🎵 Control app volume
  audio.volume = val;
}

// NEW VOLUME

const audioElement = document.getElementById('audio'); // your <audio> tag
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const source = audioCtx.createMediaElementSource(audioElement);
const gainNode = audioCtx.createGain();

// ------------------ EQUALIZER ---------------------

const equalizerDlg = document.getElementById('equalizerDlg');
const equaBtnDiv = document.getElementById('equaBtnDiv');
const eqCloseBtn = document.getElementById('eqCloseBtn');
const equalizerCloseBtn = document.getElementById('equalizerCloseBtn');

equaBtnDiv.onclick = () => {
  equalizerDlg.style.display = "block";
};
equalizerCloseBtn.onclick = () => {
  equalizerDlg.style.display = "none";
};
eqCloseBtn.onclick = () => {
  equalizerDlg.style.display = "none";
};

function updateEQSliderFill(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);

  const percent = ((val - min) / (max - min)) * 100;

  const thumbOffset = 0; // pixels worth of percentage
  const adjusted = Math.max(0, Math.min(100, percent - thumbOffset));

  slider.style.background = `
    linear-gradient(
      to right,
      #1db954 ${adjusted}%,
      #5e5e5eff ${adjusted}%
    )
  `;
}

const EQ_BANDS = [
  { freq: 31, type: "lowshelf" },
  { freq: 62, type: "peaking" },
  { freq: 125, type: "peaking" },
  { freq: 250, type: "peaking" },
  { freq: 500, type: "peaking" },
  { freq: 1000, type: "peaking" },
  { freq: 2000, type: "peaking" },
  { freq: 4000, type: "peaking" },
  { freq: 8000, type: "peaking" },
  { freq: 16000, type: "highshelf" }
];

const EQ_PRESETS = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Rock: [5.9, 4.8, 1.5, -1.8, -4.6, -1.1, 2.6, 5.5, 6.6, 7],
  Pop: [-2.4, -0.9, 1.8, 3.5, 4.6, 3.3, 1.5, 0, -0.9, -1.1],
  Jazz: [3.8, 2.3, 0.9, 1.8, -1.8, -1.8, -0.6, 1.1, 2.6, 3.5],
  Classical: [0, 0, 0, 0, 0, 0, 0, -1.5, -3.7, -5.3],
  BassBoost: [5, 4, 3, 2.1, 1.1, -0.4, -0.4, -0.4, -0.4, -0.4],
  BassReducer: [-6.2, -4.5, -3.8, -3, -1.6, -0.4, -0.4, -0.4, -0.4, -0.4],
  TrebleBoost: [-0.4, -0.4, -0.4, -0.4, -0.4, 0.6, 2.1, 3.3, 3.8, 5.2],
  Vocal: [-2.1, -3.3, -3.3, 0.9, 3.3, 3.3, 2.6, 1, -0.3, -2.1],
  SpokenWord: [-4.3, -1.1, -0.4, 0.1, 3, 4.3, 4.8, 3.8, 1.8, -0.6],
  Electronic: [4, 3.5, 0.9, -0.6, -2.6, 1.8, 0.4, 0.9, 3.5, 4.3],
  HipHop: [4.5, 3.8, 0.9, 2.3, -1.3, -1.3, 1.1, -1.3, 1.8, 2.3],
  MAXIMUM: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
};


const presetSelect = document.getElementById("eqPresetSelect");

Object.keys(EQ_PRESETS).forEach(name => {
  const opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  presetSelect.appendChild(opt);
});

function applyEQPreset(name) {
  const values = EQ_PRESETS[name];
  if (!values) return;

  values.forEach((gain, i) => {
    eqFilters[i].gain.value = gain;

    const slider = eqContainer.children[i].querySelector("input");
    slider.value = gain;
    updateEQSliderFill(slider);
  });

  localStorage.setItem("equalizer", JSON.stringify(values));
  localStorage.setItem("eqPreset", name);
}

presetSelect.addEventListener("change", () => {
  if (!presetSelect.value) return;
  applyEQPreset(presetSelect.value);
});

const eqFilters = EQ_BANDS.map(band => {
  const filter = audioCtx.createBiquadFilter();
  filter.type = band.type;
  filter.frequency.value = band.freq;
  filter.gain.value = 0; // dB
  filter.Q.value = 1;
  return filter;
});

if (!localStorage.getItem("equalizer")) {
  localStorage.setItem(
    "equalizer",
    JSON.stringify(new Array(eqFilters.length).fill(0))
  );
}

let lastNode = source;

eqFilters.forEach(filter => {
  lastNode.connect(filter);
  lastNode = filter;
});

lastNode.connect(gainNode);
gainNode.connect(audioCtx.destination);

//----- EQUALIZER JS----

const eqContainer = document.getElementById("eqSliders");
eqFilters.forEach((filter, index) => {
  const wrapper = document.createElement("div");
  wrapper.className = "eqBand";
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = -12;
  slider.max = 12;
  slider.step = 0.1;
  slider.value = filter.gain.value;
  slider.addEventListener("input", () => {
    filter.gain.value = parseFloat(slider.value);
    updateEQSliderFill(slider);
    presetSelect.value = "";
    saveEQ();
  });
  const label = document.createElement("span");
  label.textContent = formatFreq(EQ_BANDS[index].freq);
  wrapper.appendChild(slider);
  wrapper.appendChild(label);
  eqContainer.appendChild(wrapper);
  updateEQSliderFill(slider);
});

function formatFreq(freq) {
  if (freq >= 1000) {
    return (freq / 1000) + " kHz";
  }
  return freq + " Hz";
}


function saveEQ() {
  const values = eqFilters.map(f => f.gain.value);
  localStorage.setItem("equalizer", JSON.stringify(values));
}

function loadEQ() {
  const saved = JSON.parse(localStorage.getItem("equalizer"));
  const savedPreset = localStorage.getItem("eqPreset");

  if (saved) {
    saved.forEach((gain, i) => {
      eqFilters[i].gain.value = gain;
      const slider = eqContainer.children[i].querySelector("input");
      slider.value = gain;
      updateEQSliderFill(slider);
    });
  }

  if (savedPreset && EQ_PRESETS[savedPreset]) {
    presetSelect.value = savedPreset;
  } else {
    presetSelect.value = "";
  }
}

loadEQ();

document.getElementById("eqResetBtn").onclick = () => {
  eqFilters.forEach((filter, i) => {
    filter.gain.value = 0;

    const slider = eqContainer.children[i].querySelector("input");
    slider.value = 0;
    updateEQSliderFill(slider);
  });

  saveEQ();
};

document.body.addEventListener("click", () => {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
});

let isMuted = false;
let maxVolume;

const savedMuted = localStorage.getItem("isMuted") === "1";
const savedVolumeRaw = localStorage.getItem("volume");
let lastVolume =
  savedVolumeRaw !== null ? parseFloat(savedVolumeRaw) : 1;

lastVolume = Math.max(0, Math.min(maxVolume ?? 1, lastVolume));

gainNode.gain.value = lastVolume;
volumeRange.value = lastVolume;



//SET MAX VOLUME ON START

async function setPlayerMaxVolume() {
  const getSettMaxVolume = await window.electronAPI.getMaxVolume();
  setMaxVolume(getSettMaxVolume);
  maxVolume = getSettMaxVolume;
 
  // Load saved volume from localStorage or default to 1
  gainNode.gain.value = lastVolume;
  volumeRange.value = lastVolume;
  volumeRange.max = maxVolume; // set initial max
}

setPlayerMaxVolume();

function updateGain() {
  const val = parseFloat(volumeRange.value);

  // 🔒 Mute always wins
  if (isMuted) {
    gainNode.gain.value = 0;
  } 
  else {
    gainNode.gain.value = val;

    // Only store real volume when audible
    if (val > 0) {
      lastVolume = val;
      localStorage.setItem("volume", val);
    }
  }

  const percent = val * 100;

  // Tooltip
  tooltip.textContent = `${Math.round(percent)}%`;

  // Slider fill
  const fillPercent = (val / maxVolume) * 100;
  volumeRange.style.background =
    `linear-gradient(to right, rgb(29,185,84) ${fillPercent}%, #d3d3d3 ${fillPercent}%)`;

  // Volume icon
  if (isMuted || val === 0) {
    volumeBtnDiv.innerHTML = volumeMute;
  } 
  else if (percent < 15) {
    volumeBtnDiv.innerHTML = volumeLowest;
  } 
  else if (percent < 50) {
    volumeBtnDiv.innerHTML = volumeLow;
  } 
  else if (percent >= 80) {
    volumeBtnDiv.innerHTML = volumeMax;
  } 
  else {
    volumeBtnDiv.innerHTML = volumeLow;
  }

  // Tooltip position
  const sliderWidth = volumeRange.offsetWidth;
  const tooltipWidth = tooltip.offsetWidth;
  const offset =
    (val / maxVolume) * (sliderWidth - 14);

  tooltip.style.left = `${offset + 25 - tooltipWidth / 2}px`;
}

// Volume slider
volumeRange.addEventListener("input", () => {
  if (isMuted && parseFloat(volumeRange.value) > 0) {
    isMuted = false;
    localStorage.setItem("isMuted", "0");
  }
  updateGain();
});


document.body.addEventListener('click', () => {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
});

// Function to change max volume dynamically
function setMaxVolume(newMax) {
  maxVolume = newMax;
  volumeRange.max = newMax;

  // Keep the current volume percentage the same
  const current = parseFloat(volumeRange.value);
  const percent = current / lastVolume; // wrong before

  // Fix: percent must be based on maxVolume, not lastVolume
  const normalizedPercent = current / newMax;

  volumeRange.value = normalizedPercent * newMax;

  updateGain();
}

// 🔊 Mute / Unmute toggle
volumeBtnDiv.addEventListener("click", () => {
  if (!isMuted) {
    // 🔇 MUTE
    lastVolume = parseFloat(volumeRange.value) > 0
      ? parseFloat(volumeRange.value)
      : lastVolume;

    isMuted = true;
    localStorage.setItem("isMuted", "1");

    //volumeRange.value = 0;
    gainNode.gain.value = 0;
    volumeBtnDiv.innerHTML = volumeMute;

    updateGain();
  } 
  else {
    // 🔊 UNMUTE
    const restore = lastVolume > 0 ? lastVolume : 0.25;

    isMuted = false;
    localStorage.setItem("isMuted", "0");

    volumeRange.value = restore;   // 🔑 restore slider FIRST
    gainNode.gain.value = restore;

    updateGain();
  }
});

// VOLUME CHECKER ON START

if (savedMuted) {
  gainNode.gain.value = 0;
  volumeRange.value = 0;
  isMuted = true;
  volumeBtnDiv.innerHTML = volumeMute;
} 
else {
  gainNode.gain.value = lastVolume;
  volumeRange.value = lastVolume;
  isMuted = false;
}

updateGain();

function changeVolumeBy(delta) {
  let newVal = parseFloat(volumeRange.value) + delta;

  newVal = Math.max(0, Math.min(maxVolume, newVal));

  volumeRange.value = newVal;
  gainNode.gain.value = newVal;

  isMuted = newVal === 0 ? true : false;
  updateGain();
}

/* 
setMaxVolume(1); // limit to 100% (normal)
setMaxVolume(3); // allow up to 300%
setMaxVolume(6); // allow up to 600% 
*/

// EVENTS DEBUG
/* [
  'loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough',
  'play', 'playing', 'pause', 'ended', 'timeupdate',
  'seeking', 'seeked', 'ratechange', 'volumechange',
  'stalled', 'suspend', 'waiting', 'error', 'abort', 'emptied'
].forEach(evt => {
  audio.addEventListener(evt, () => { 
    console.log('🎵 Event:', evt) 
    //console.log("Currentime",audio.currentTime)
  } 
  );
});
 */

// SIDEBAR BTNS

let videoLoaded = false; // set this to true when a video starts
let showingVideoPlayer = false; // toggles between player and list

const sideButtons = document.querySelectorAll('[id$="SideBtn"]');
const contentDivs = document.querySelectorAll('[id$="ContentDiv"]');

let lastSection = null; // to detect when user switches sections

const allScreens = document.querySelectorAll('.middleContentItems');

sideButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const sectionName = btn.id.replace('SideBtn', '');
    const targetDiv = document.getElementById(`${sectionName}ContentDiv`);

    // 🔹 Detect section change
    const switchingSection = lastSection !== sectionName;
    lastSection = sectionName;

    // 🔹 Always hide ALL screens
    allScreens.forEach(el => el.style.display = 'none');
    document.getElementById('videoPlayerDiv').style.display = 'none';
    sideButtons.forEach(b => b.classList.remove('activeBtn'));

    // 🔹 Special case: Videos section
    if (btn.id === 'videosSideBtn') {
      if (!videoLoaded) {
        // No video at all → always list
        showVideoList();
        showingVideoPlayer = false;
        btn.classList.add('activeBtn');
        return;
      }

      // A video exists
      if (switchingSection) {
        // Coming from another section
        if (videoIsEnded) {
          // FIRST CLICK after video ended → show list
          showVideoList();
          showingVideoPlayer = false;   // <-- IMPORTANT so 2nd click works
        } else {
          // Playing or paused → always show player first
          showVideoPlayer();
          showingVideoPlayer = true;
        }
      } 
      else {
        // SECOND CLICK or later → toggle
        if (showingVideoPlayer) {
          showVideoList();
          showingVideoPlayer = false;
        } 
        else {
          showVideoPlayer();
          showingVideoPlayer = true;
        }
      }

      btn.classList.add('activeBtn');
      return;
    }

    // 🔹 Normal behavior for other sections
    if (targetDiv) targetDiv.style.display = 'block';
    btn.classList.add('activeBtn');
  });
});


// SIDEBAR BUTTONS

artistsSideBtn.addEventListener('click', async () => {
  await loadArtists();
});
albumsSideBtn.addEventListener('click', async () => {
  await loadAlbums();
});
genresSideBtn.addEventListener('click', async () => {
  await loadGenres();
});

foldersSideBtn.addEventListener('click', async () => {
  await loadFoldersUI();
});
videosSideBtn.addEventListener('click', async () => {
  await loadVideos();
});

songsSideBtn.addEventListener('click', async () => {
  const songs = await window.electronAPI.getSongs();
  currentSongList = songs;
});

homeSideBtn.addEventListener('click', async () => {
  await loadHomePage();
});

playlistsSideBtn.onclick = async () => {
  await loadPlaylists();
};

searchSideBtn.onclick = async () => {
  //await loadInitialSearchPage();
};

const settingsSideBtn = document.getElementById('settingsSideBtn');

//START WITH HOMEPAGE
homeSideBtn.click();

// PLAYLIST/PLAYING QUEUE CONTROL---------------------------

const toggleBtn = document.getElementById('togglePlaylistBtn');

toggleBtn.addEventListener('click', () => {
  playlistPanel.classList.toggle('retracted');
  updateMiddleMargin();
});

const playlistPanel = document.getElementById('playlistPanel');
const dragBarQueue = document.getElementById('dragBarQueue');

let isDraggingQueue = false;
let startX = 0;
let startOffset = 0;  // 0 visible, positive → hidden offset
let prevVisible = true;

const PANEL_WIDTH = 320;
const SNAP_THRESHOLDQueue = 80; // how far you must drag to hide/show

function applyOffset(x, remember = true) {
  const clamped = Math.min(PANEL_WIDTH, Math.max(0, x));
  playlistPanel.style.transform = `translateX(${clamped}px)`;
  if (remember) startOffset = clamped;
}

// Start dragging
dragBarQueue.addEventListener('pointerdown', (e) => {
  isDraggingQueue = true;
  startX = e.clientX;
  document.body.style.cursor = 'ew-resize';
  document.body.style.userSelect = 'none';
  playlistPanel.style.transition = 'none';
  dragBarQueue.setPointerCapture?.(e.pointerId);
});

// Move
document.addEventListener('pointermove', (e) => {
  if (!isDraggingQueue) return;

  let delta = startX - e.clientX;
  if (!prevVisible) delta -= PANEL_WIDTH; // adjust if starting hidden

  const newOffset = Math.min(PANEL_WIDTH, Math.max(0, delta));
  applyOffset(newOffset, false);
});

// Release
document.addEventListener('pointerup', (e) => {
  if (!isDraggingQueue) return;
  isDraggingQueue = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  dragBarQueue.releasePointerCapture?.(e.pointerId);
  playlistPanel.style.transition = 'transform 0.2s ease';

  // decide final state
  const offset = parseFloat(playlistPanel.style.transform.match(/-?\d+\.?\d*/)?.[0] || 0);
  if (offset > SNAP_THRESHOLDQueue) {
    playlistPanel.classList.add('hidden');
    playlistPanel.style.transform = `translateX(${PANEL_WIDTH}px)`;
    prevVisible = false;
  } else {
    playlistPanel.classList.remove('hidden');
    playlistPanel.style.transform = 'translateX(0)';
    prevVisible = true;
  }
});

// Double-click toggles
dragBarQueue.addEventListener('click', () => {
  if (prevVisible) {
    playlistPanel.classList.add('hidden');
    playlistPanel.style.transform = `translateX(${PANEL_WIDTH}px)`;
    prevVisible = false;
    updateMiddleMargin();
  } 
  else {
    playlistPanel.classList.remove('hidden');
    playlistPanel.style.transform = 'translateX(0)';
    prevVisible = true;
    updateMiddleMargin();
  }
});

const hotZone = document.getElementById('playlistHotZone');

hotZone.addEventListener('click', () => {
  showPlaylist();
  updateMiddleMargin();
});

function updateHotZone() {
  const playBarHeight = playBar.offsetHeight;
  const menuBarHeight = document.getElementById('menu_bar').offsetHeight;
  hotZone.style.top = `40px`;
  hotZone.style.bottom = `${playBarHeight}px`;
}
window.addEventListener('load', updateHotZone);
window.addEventListener('resize', updateHotZone);
setInterval(updateHotZone, 200); // or call it when playbar resizes

function hidePlaylist() {
  playlistPanel.classList.add('hidden');
  playlistPanel.style.transform = `translateX(${PANEL_WIDTH}px)`;
  prevVisible = false;
  updateMiddleMargin();
}

function showPlaylist() {
  playlistPanel.classList.remove('hidden');
  playlistPanel.style.transform = 'translateX(0)';
  prevVisible = true;
  updateMiddleMargin();
}
const middleContentWrapper = document.getElementById('middleContentWrapper');

function updateMiddleMargin() {
  if (playlistPanel.classList.contains('hidden') || playlistPanel.classList.contains('collapsed')) {
    middleContentWrapper.style.marginRight = '0';
  } 
  else if (playlistPanel.classList.contains('retracted')) {
    middleContentWrapper.style.marginRight = '70px';
  } 

  if (playBarDiv.classList.contains('collapsed')) {
    applyHeight(0);
  } 
  else {
    applyHeight(MAX_HEIGHT);
  } 

}

// --------ADD MUSIC BUTTON / ADD VIDEO BUTTON----------- 

const addSongsBtn = document.getElementById('addSongsBtn');
const addVideosBtn = document.getElementById('addVideosBtn');
const addFoldersBtn = document.getElementById('addFoldersBtn');
const addAudioFoldersBtn = document.getElementById('addAudioFoldersBtn');
const addVideoFoldersBtn = document.getElementById('addVideoFoldersBtn');

const addAudioFoldersBtnFolderList = document.getElementById('addAudioFoldersBtnFolderList');
const addVideoFoldersBtnFolderList = document.getElementById('addVideoFoldersBtnFolderList');


const addSongsBtnSongList = document.getElementById('addSongsBtnSongList');
const addAudioFoldersBtnSongList = document.getElementById('addAudioFoldersBtnSongList');

const addVideosBtnVideoList = document.getElementById('addVideosBtnVideoList');
const addVideoFoldersBtnVideoList = document.getElementById('addVideoFoldersBtnVideoList');

addAudioFoldersBtnFolderList.addEventListener('click', async () => {
  await window.electronAPI.addAudioFolders();
});
addVideoFoldersBtnFolderList.addEventListener('click', async () => {
  await window.electronAPI.addVideoFolders();
});

addSongsBtnSongList.addEventListener('click', async () => {
  await window.electronAPI.addSongs();
});
addAudioFoldersBtnSongList.addEventListener('click', async () => {
  await window.electronAPI.addAudioFolders();
});

addVideosBtnVideoList.addEventListener('click', async () => {
  await window.electronAPI.addVideos();
});
addVideoFoldersBtnVideoList.addEventListener('click', async () => {
  await window.electronAPI.addVideoFolders();
});

//---------------------------

addSongsBtn.addEventListener('click', async () => {
  await window.electronAPI.addSongs();
});

addVideosBtn.addEventListener('click', async () => {
  await window.electronAPI.addVideos();
});

addFoldersBtn.addEventListener('click', async () => {
  await window.electronAPI.addFolders();
});

addAudioFoldersBtn.addEventListener('click', async () => {
  await window.electronAPI.addAudioFolders();
});

addVideoFoldersBtn.addEventListener('click', async () => {
  await window.electronAPI.addVideoFolders();
});

// -=-=-=-=-=-=-=SONG LIST=-=-=-=-=-=-= 

// RENDER SONG LIST

async function loadSongs() {
  const songs = await window.electronAPI.getSongs();
  currentSongList = songs;

  const savedSort = (await window.electronAPI.getSongLibrarySort()) || "added_asc";

  setActiveSortOptionSongList(savedSort);

  sortSongs(savedSort);
}

function setActiveSortOptionSongList(sortKey) {
  document
    .querySelectorAll('#sortDropdownSongList .sortOption')
    .forEach(o => o.classList.remove('active'));

  const opt = document.querySelector(
    `#sortDropdownSongList .sortOption[data-sort="${sortKey}"]`
  );

  if (opt) opt.classList.add('active');
}

function sortSongs(sortKey) {
  currentSongList.sort((a, b) => {
    switch (sortKey) {
      case "added_desc": // Newest
        return new Date(b.addedDate) - new Date(a.addedDate);
      case "added_asc": // Oldest
        return new Date(a.addedDate) - new Date(b.addedDate);
      case "plays_desc": // Most listened
        return (b.playCounter || 0) - (a.playCounter || 0);
      case "plays_asc": // Least listened
        return (a.playCounter || 0) - (b.playCounter || 0);
      case "title_asc":
        return (a.title || "").localeCompare(b.title || "");
      case "title_desc":
        return (b.title || "").localeCompare(a.title || "");
      case "artist_asc":
        return (a.artist || "").localeCompare(b.artist || "");
      case "artist_desc":
        return (b.artist || "").localeCompare(a.artist || "");
      case "albumName_asc":
        return (a.albumName || "").localeCompare(b.albumName || "");
      case "albumName_desc":
        return (b.albumName || "").localeCompare(a.albumName || "");
      default:
        return 0;
    }
  });
  loadSongsFromList(currentSongList);
}


function addSongToUI(song) {
  const songsList = document.getElementById('songsList');

  const albumArtPath = song.albumArt && song.albumArt.trim() !== '' 
    ? song.albumArt 
    : 'images/albumph.png';

  const isFav = song.isFavorite;
  const favStatus = isFav ? 'fav' : '';
  const favIcon = isFav
    ? `<svg class="heart" viewBox="0 -960 960 960">
    <path d="M480-142.33q-12 0-24.17-4.34Q443.67-151 434.67-160l-58.34-53.67q-118-109-207.16-210.5Q80-525.67 80-640q0-91.33 61.33-152.67 61.34-61.33 152-61.33Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.33Q880-731.33 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9 9-21.16 13.33-12.17 4.34-24.17 4.34Z"/>
    </svg>`
    : `<svg class="heart" viewBox="0 -960 960 960">
    <path d="M480-142.33q-11.8 0-24.02-4.25-12.22-4.25-21.49-13.59l-58.16-53.5q-118-109-207.16-210.5Q80-525.67 80-640q0-91.44 61.33-152.72 61.34-61.28 152-61.28Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.28Q880-731.44 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9.16 9.25-21.25 13.46-12.08 4.21-24.08 4.21Zm-30-543q-27.67-46.34-68-74.17t-88.67-27.83q-64 0-105.33 41.66-41.33 41.67-41.33 105.96 0 55.71 38.25 117.65 38.25 61.93 91.5 120.16T386.5-293.33q56.83 50.33 93.5 84 36.67-33 93.5-83.67t110-109.33Q736.67-461 775-522.96q38.33-61.96 38.33-117.04 0-64-41.66-105.67-41.67-41.66-105-41.66-49 0-89 27.5t-69 74.5q-5.67 8.66-13 12.66-7.34 4-16.34 4t-16.66-4q-7.67-4-12.67-12.66Zm30 187Z"/>
    </svg>`;

  const duration = formatDuration(song.duration);

  const row = document.createElement('div');
  row.className = 'songsRow';
  row.dataset.id = song.id;
  row.innerHTML = `
    <div class="songArtCol">
      <div class="albumArtWrapper">
        <img src="${albumArtPath}" alt="">
        <div class="playOverlay" data-id="${song.id}">▶</div>
      </div>
    </div>
    <div class="songNameCol">${song.title}</div>
    <div class="songArtistCol">${song.artist || 'Unknown Artist'}</div>
    <div class="songAlbumCol">${song.albumName || 'Unknown Album'}</div>
    <div class="songYearCol">${song.year || ''}</div>
    <div class="songFavCol ${favStatus}">${favIcon}</div>
    <div class="songDurationCol">${duration}</div>
  `;

  // Append at the bottom
  songsList.appendChild(row);

  // add your event listeners same as in loadSongs()
    row.addEventListener("dblclick", async (e) => {
      if (e.target.closest(".songFavCol")) return;
      document.querySelectorAll(".songsRow.selectedRow")
        .forEach(r => r.classList.remove("selectedRow"));
      row.classList.add("selectedRow");

      //const songs = await window.electronAPI.getSongs();
      //currentSongList = songs;

      await playCommand(song.id, currentSongList);
      await loadPlayingQueue();
    });

    // Play button click
    row.querySelector(".playOverlay").addEventListener("click", async (e) => {
      e.stopPropagation();

      //const songs = await window.electronAPI.getSongs();
      //currentSongList = songs;

      await playCommand(song.id, currentSongList);
      await loadPlayingQueue();
    });

  const favEl = row.querySelector('.songFavCol');
  favEl.addEventListener('click', async (e) => {
    e.stopPropagation();
    const newStatus = !favEl.classList.contains('fav');
    //await window.electronAPI.setSongFavorite(song.id, newStatus ? 1 : 0);
    const result = await window.electronAPI.setSongFavorite(song.id, newStatus ? 1 : 0);
    if (result?.success) {
      const title = result.row.title;
      if (newStatus) {
        showErrorMsg("info", `Added to Favorites: ${title}`);
      } 
      else {
        showErrorMsg("info", `Removed from Favorites: ${title}`);
      }
    }
    favEl.classList.toggle('fav', newStatus);
  });

  // auto update total count
  updateSongsCount();
}

function formatDuration2(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
function formatDuration(seconds) {
  seconds = Math.floor(seconds);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  return `${m}:${s.toString().padStart(2, "0")}`;
}

window.addEventListener('DOMContentLoaded', loadSongs);


// Toggle dropdown visibility
const sortBtnSongList = document.getElementById('sortBtnSongList');
const sortDropdownSongList = document.getElementById('sortDropdownSongList');

sortBtnSongList.addEventListener('click', () => {
  sortDropdownSongList.style.display = sortDropdownSongList.style.display === 'block' ? 'none' : 'block';
});

// Hide dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!sortBtnSongList.contains(e.target) && !sortDropdownSongList.contains(e.target)) {
    sortDropdownSongList.style.display = 'none';
  }
});

function updateSongsCount() {
  const songsList = document.getElementById('songsList');
  const totalSongsEl = document.getElementById('songsTotalNumber');
  const count = songsList.children.length;
  totalSongsEl.textContent = count === 1 ? '1 Song' : `${count} Songs`;
}

// =-=-=-=-=-=-=UP NOTIFICATIONS=-=-=-=-=-=-= 

let errorMsgNotificationTimeouts = [];

function showErrorMsg(type, message, duration = 5000) {
    const errorBox = document.getElementById("errorMsgDisplayDiv");

    const errorMsgDisplay = document.createElement('div');
    errorMsgDisplay.classList.add('errorMsgDisplay');

    errorBox.appendChild(errorMsgDisplay);

    // Close button
    const closeBtn = document.createElement('div');
    closeBtn.classList.add('errorCloseBtn');
    closeBtn.innerHTML = `
        <svg class="errorxBtn" viewBox="0 -960 960 960">
                <path d="M480-424 284-228q-11 11-28 11t-28-11q-11-11-11-28t11-28l196-196-196-196q-11-11-11-28t11-28q11-11 28-11t28 11l196 196 196-196q11-11 28-11t28 11q11 11 11 28t-11 28L536-480l196 196q11 11 11 28t-11 28q-11 11-28 11t-28-11L480-424Z"/>
        </svg>
    `;
    errorMsgDisplay.appendChild(closeBtn);

    closeBtn.onclick = () => {
        errorMsgDisplay.classList.add('fadeOut');
        setTimeout(() => {
            errorMsgDisplay.remove();
        }, 500);
    };

    const errorIconDiv = document.createElement('div');
    errorIconDiv.classList.add('errorIconDiv');

    errorMsgDisplay.appendChild(errorIconDiv);

    const errorMsg = document.createElement('span');

    // Set message text
    errorMsg.textContent = message;

    errorMsgDisplay.appendChild(errorMsg);

    const errorTimeLeftDiv = document.createElement('div');
    errorTimeLeftDiv.classList.add('errorTimeLeftDiv');

    errorMsgDisplay.appendChild(errorTimeLeftDiv);

    const errorProgressBar = document.createElement('div');
    errorProgressBar.classList.add('errorProgressBar');

    errorTimeLeftDiv.appendChild(errorProgressBar);

    // Reset progress bar
    errorProgressBar.style.transition = "none"; // Remove transition to reset width instantly
    errorProgressBar.style.width = "100%";

    // Delay applying transition to ensure it animates properly
    setTimeout(() => {
        errorProgressBar.style.transition = `width ${duration / 1000}s linear`;
        errorProgressBar.style.width = "0%";
    }, 50);

    // Set the icon and progress bar color based on the type
    if (type == 'error') {
        errorIconDiv.innerHTML = `
        <svg class="errorIconSvg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM7.29289 16.7071C6.90237 16.3166 6.90237 15.6834 7.29289 15.2929L10.5858 12L7.29289 8.70711C6.90237 8.31658 6.90237 7.68342 7.29289 7.29289C7.68342 6.90237 8.31658 6.90237 8.70711 7.29289L12 10.5858L15.2929 7.29289C15.6834 6.90237 16.3166 6.90237 16.7071 7.29289C17.0976 7.68342 17.0976 8.31658 16.7071 8.70711L13.4142 12L16.7071 15.2929C17.0976 15.6834 17.0976 16.3166 16.7071 16.7071C16.3166 17.0976 15.6834 17.0976 15.2929 16.7071L12 13.4142L8.70711 16.7071C8.31658 17.0976 7.68342 17.0976 7.29289 16.7071Z"/>
        </svg> 
        `;
        errorProgressBar.classList.add('errorColor');
        //SET COLOR RED WHEN IS AN ERROR MSG
        errorMsg.classList.add('errorMsgColor');
    }
    else if (type == 'ok') {
        errorIconDiv.innerHTML = `
        <svg class="okIconSvg" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zm2.72 5.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-2-2a.75.75 0 011.06-1.06l1.47 1.47 3.97-3.97z" clip-rule="evenodd"/>
        </svg>
        `;
        errorProgressBar.classList.add('okColor');
    }
    else if (type == 'att') {
        errorIconDiv.innerHTML = `
        <svg class="attIconSvg" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 1a2.143 2.143 0 00-1.827 1.024l-5.88 9.768a2.125 2.125 0 00.762 2.915c.322.188.687.289 1.06.293h11.77a2.143 2.143 0 001.834-1.074 2.126 2.126 0 00-.006-2.124L9.829 2.028A2.149 2.149 0 008 1zM7 11a1 1 0 011-1h.007a1 1 0 110 2H8a1 1 0 01-1-1zm1.75-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" clip-rule="evenodd"/>
        </svg>
        `;
        errorProgressBar.classList.add('attColor');
    }
    else if (type == 'info') {
        errorIconDiv.innerHTML = `
        <svg class="infoIconSvg" viewBox="0 0 416.979 416.979">
            <path d="M356.004,61.156c-81.37-81.47-213.377-81.551-294.848-0.182c-81.47,81.371-81.552,213.379-0.181,294.85
                c81.369,81.47,213.378,81.551,294.849,0.181C437.293,274.636,437.375,142.626,356.004,61.156z M237.6,340.786
                c0,3.217-2.607,5.822-5.822,5.822h-46.576c-3.215,0-5.822-2.605-5.822-5.822V167.885c0-3.217,2.607-5.822,5.822-5.822h46.576
                c3.215,0,5.822,2.604,5.822,5.822V340.786z M208.49,137.901c-18.618,0-33.766-15.146-33.766-33.765
                c0-18.617,15.147-33.766,33.766-33.766c18.619,0,33.766,15.148,33.766,33.766C242.256,122.755,227.107,137.901,208.49,137.901z"/>
        </svg>
        `;
        errorProgressBar.classList.add('infoColor');
    }
    // Automatically remove notification after the duration
    const timeoutIdUp = setTimeout(() => {
        errorMsgDisplay.classList.add('upRightFadeOut');
        setTimeout(() => {
            errorMsgDisplay.remove();
            errorMsgNotificationTimeouts.shift();
        }, 500);
    }, duration);

    errorMsgNotificationTimeouts.push(timeoutIdUp);
}

/*  
showErrorMsg('error', "Something went wrong!", 5000);
showErrorMsg('att', 'Pay Attention!', 5000);
showErrorMsg('ok', "Everything is fine!", 5000);
showErrorMsg('info', "Information!", 5000); 
*/

// ADD FILES PROGRESS DISPLAY

const importProgress = document.getElementById("importProgress");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");


let activeImportToast = null;

function showImportProgress(message, progress = 0) {
  const errorBox = document.getElementById("errorMsgDisplayDiv");

  // If already exists, update it
  if (activeImportToast) {
      const msgSpan = activeImportToast.querySelector(".importMsg");
      const bar = activeImportToast.querySelector(".importProgressFill");

      msgSpan.textContent = message;
      bar.style.width = progress + "%";

      return;
  }

  // Create container
  const toast = document.createElement("div");
  toast.classList.add("errorMsgDisplay", "importToast");

  // Close button
  const closeBtn = document.createElement("div");
  closeBtn.classList.add("errorCloseBtn");
  closeBtn.innerHTML = `
  <svg class="errorxBtn" viewBox="0 -960 960 960">
      <path d="M480-424 284-228q-11 11-28 11t-28-11q-11-11-11-28t11-28l196-196-196-196q-11-11-11-28t11-28q11-11 28-11t28 11l196 196 196-196q11-11 28-11t28 11q11 11 11 28t-11 28L536-480l196 196q11 11 11 28t-11 28q-11 11-28 11t-28-11L480-424Z"/>
  </svg>`;
  closeBtn.onclick = () => {
      toast.remove();
      activeImportToast = null;
  };
  toast.appendChild(closeBtn);

  // Left icon
  const iconDiv = document.createElement("div");
  iconDiv.classList.add("errorIconDiv");
  iconDiv.innerHTML = `
  <svg class="importIconSvg" viewBox="0 0 128 128">
    <g transform="scale(-1,1) translate(-128,0)">
      <path d="M 28.5 11.25 C 25.598125 11.54359 23.375 14.015184 23.375 17 L 23.375 111 C 23.375 114.1838 25.90994 116.75 29.09375 116.75 L 98.90625 116.75 C 102.09005 116.75 104.625 114.1838 104.625 111 L 104.625 94.84375 L 79.53125 94.84375 L 79.53125 110.53125 L 39.90625 78.125 L 79.53125 45.71875 L 79.53125 61.125 L 104.625 61.125 L 104.625 40.375 L 83.59375 40.375 C 79.28764 40.375 75.53125 37.233891 75.53125 33.0625 L 75.53125 11.25 L 29.09375 11.25 C 28.894762 11.25 28.693458 11.230427 28.5 11.25 z M 79.53125 11.25 L 79.53125 33.0625 C 79.53125 34.776622 81.16322 36.375 83.59375 36.375 L 104.625 36.375 L 79.53125 11.25 z"/>
    </g>
  </svg>`;

  toast.appendChild(iconDiv);

  // Right content wrapper (text + progress)
  const rightContent = document.createElement("div");
  rightContent.classList.add("importRightContent");

  // Message
  const msg = document.createElement("div");
  msg.classList.add("importMsg");
  msg.textContent = message;
  rightContent.appendChild(msg);

  // Progress bar
  const barContainer = document.createElement("div");
  barContainer.classList.add("importProgressBar");

  const barFill = document.createElement("div");
  barFill.classList.add("importProgressFill");
  barFill.style.width = progress + "%";

  barContainer.appendChild(barFill);
  rightContent.appendChild(barContainer);

  // Append rightContent
  toast.appendChild(rightContent);

  errorBox.appendChild(toast);
  activeImportToast = toast;

}

/* showImportProgress(`Importing songs… 1/2554143`, 50); */

// FOLDERS LIST

const btnAddFolder = document.getElementById('btnAddFolder');
const foldersList = document.getElementById('foldersList');
const btnReload = document.getElementById('btnReload');
const btnRescan = document.getElementById('btnRescan');
const indexProgress = document.getElementById('indexProgress');
const indexText = document.getElementById('indexText');
const indexBar = document.getElementById('indexBar');
const toastContainer = document.getElementById('toastContainer');
const foldersTotalNumber = document.getElementById('foldersTotalNumber');

async function loadFoldersUI() {
  const rows = await window.electronAPI.getWatchFolders();
  foldersList.innerHTML = '';

  function getFolderName(fullPath) {
    return fullPath.split(/[/\\]/).pop();
  }

  if (rows.length >= 1) {
    if (rows.length == 1) {
      foldersTotalNumber.innerText = `1 Folder`;
     }
    else {
      foldersTotalNumber.innerText = `${rows.length} Folders`;
    }
  }
  else { 
    foldersTotalNumber.innerText = `No Folders`;
  }

  for (const r of rows) {
    const folderName = getFolderName(r.path);

    // fetch stats from backend
    const stats = await window.electronAPI.getFolderStats(r.path);
    const { subfolderCount, songCount, totalBytes } = stats;

    const hasSubfolders = subfolderCount > 0;
    const folderType = r.type || "mixed";

    const li = document.createElement('li');
    li.className = 'folderItem';
    li.dataset.path = r.path;

    li.innerHTML = `
      <div class="folderListItemDiv">

        <div class="folderItemNCloseBtn">

          <svg class="folderListSvg ${folderType}" viewBox="0 -960 960 960">
            <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h207q16 0 30.5 6t25.5 17l57 57h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Z"/>
          </svg>

          <div class="folderMeta">
            <span class="folderName">${folderName}</span>
            <span class="folderStats">
              ${subfolderCount} subfolders • ${songCount} media files • ${formatSize(totalBytes)}
              <span class="fullPath">${r.path}</span>
            </span>
          </div>

        </div>

        <div class="folderActions">

          ${hasSubfolders
            ? `<div class="btnExpand" data-path="${r.path}"><span>▼</span></div>`
            : `<div class="btnExpandPlaceholder"></div>`
          }

          <div class="btnRemove" data-path="${r.path}">❌</div>

        </div>

      </div>
    `;

    const subtree = document.createElement("ul");
    subtree.className = "folderSubtree";
    subtree.style.display = "none";

    li.appendChild(subtree);
    foldersList.appendChild(li);
  }

}

// CLICK X BUTTON ON FOLDER ITEM
foldersList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btnRemoveSub, .btnRemove");
  if (!btn) return;

  e.stopPropagation(); // don't expand folder when deleting

  const p = btn.dataset.path;
  if (!p) return;

  const result = await confirmDlg(`Delete <b>${p}</b> and all its media files?`, { html: true });
  if (!result) return;

  await window.electronAPI.removeFolder(p);

  showErrorMsg('info', `Removed folder ${p}`);

  await loadSongs();
  await loadVideos();
  await loadFoldersUI();
});

// CLICK EXPAND FOLDER BUTTON
foldersList.addEventListener("click", async (e) => {
  const expandBtn = e.target.closest(".btnExpand");
  if (!expandBtn) return;

  e.stopPropagation();

  const li = expandBtn.closest("li");
  await toggleFolderExpansion(li);

  // Rotate arrow
  const subtree = li.querySelector(".folderSubtree");
  const open = subtree.style.display === "block";
  expandBtn.textContent = open ? "▲" : "▼";
});

foldersList.addEventListener("click", async (e) => {
  const row = e.target.closest(".folderListItemDiv");
  if (!row) return;

  // If clicking the arrow → DO NOT open folder
  if (e.target.closest(".btnExpand")) return;

  // If clicking the remove button → DO NOT open folder
  if (e.target.closest(".btnRemove")) return;

  const li = row.closest("li");
  const path = li.dataset.path;

  await openFolderSongs(path);
});

const folderContextMenu = document.getElementById("folderContextMenu");
const ctxFolderName = document.getElementById("ctxFolderName");
const btnOpenFolder = document.getElementById("ctxOpenFolder");
const btnRemoveFolder = document.getElementById("ctxRemoveFolder");
const ctxFolderInfo = document.getElementById("ctxFolderInfo");

let currentFolderPath = null;

document.addEventListener("contextmenu", async (e) => {
  // detect root or subfolder items
  const li = e.target.closest(".folderItem, .folderSubItem");
  if (!li) return;

  e.preventDefault();
  e.stopPropagation(); // prevent expanding when right-clicking

  currentFolderPath = li.dataset.path;
  const name = li.querySelector(".folderName")?.textContent || li.textContent;

  ctxFolderName.textContent = name.trim();

  folderContextMenu.style.top = e.clientY + "px";
  folderContextMenu.style.left = e.clientX + "px";
  folderContextMenu.style.display = "block";
});
document.addEventListener("mousedown", (e) => {
  if (e.button === 2) {
    // If right-click, don't toggle folder expansion
    e.stopPropagation();
  }
}, true);

// Hide the menu when clicking anywhere else
document.addEventListener("click", (e) => {
  if (!folderContextMenu.contains(e.target)) {
    folderContextMenu.style.display = "none";
  }
});

btnOpenFolder.addEventListener("click", async () => {
  if (currentFolderPath) {
    await window.electronAPI.openFolder(currentFolderPath);
  }
  folderContextMenu.style.display = "none";
});

// Prevent left-click on items from propagating out
folderContextMenu.addEventListener("click", (e) => {
  e.stopPropagation();
});

btnRemoveFolder.addEventListener("click", async () => {
  if (currentFolderPath) {
    //const folderName = currentFolderPath.split(/[/\\]/).pop();

    const result = await confirmDlg(`Delete <b>${currentFolderPath}</b> and all its media files?`, { html: true });
    if (result) {
      folderContextMenu.style.display = "none";
      await window.electronAPI.removeFolder(currentFolderPath);
      showErrorMsg('info', `Removed folder ${currentFolderPath}`);
      await loadFoldersUI();
    }
    else {
      folderContextMenu.style.display = "none";
    }
    
  }

  folderContextMenu.style.display = "none";
  
  await loadSongs();
  await loadVideos();
  await loadFoldersUI();
});


function getFolderName(fullPath) {
  return fullPath.split(/[/\\]/).pop();
}
function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}

btnAddFolder.addEventListener('click', async () => {
  await window.electronAPI.addFolders();
});

btnReload.addEventListener('click', async () => {
  await loadFoldersUI();
});

btnRescan.addEventListener('click', async () => {
  window.electronAPI.fullFolderRescan(); // deep scan add missing files
});

async function toggleFolderExpansion(folderLi) {
  let subtree = folderLi.querySelector(".folderSubtree");

  // Create subtree UL if missing
  if (!subtree) {
    subtree = document.createElement("ul");
    subtree.className = "folderSubtree";
    folderLi.appendChild(subtree);
  }

  // Toggle visibility
  const isOpen = subtree.style.display === "block";
  subtree.style.display = isOpen ? "none" : "block";
  if (isOpen) return; // If closing, stop here

  // If already loaded, skip fetching again
  if (subtree.dataset.loaded) return;

  const folderPath = folderLi.dataset.path;

  // Get the parent folder's type from its SVG class
  const svg = folderLi.querySelector(".folderListSvg");

  // e.g., classes: "folderListSvg music"
  const parentType = [...svg.classList].find(c =>
    ["audio", "video", "mixed"].includes(c)
  ) || "mixed";
  
  // Fetch direct subfolders from backend
  const subfolders = await window.electronAPI.getSubfolders(folderPath);

  subtree.innerHTML = ""; // Clear old entries

  for (const sub of subfolders) {
    // Pass down parentType so subfolders inherit color
    const subLi = await createFolderItem(sub, true, parentType);
    subtree.appendChild(subLi);
  }

  subtree.dataset.loaded = "true";
}

async function openFolderSongs(path) {
  const songs = await window.electronAPI.getSongsInsideFolder(path);
  showFolderSongs(`Folder: ${getFolderName(path)}`, songs, path);
}

// Optional: Hide context menu or collapse tree on document click (outside folder items)
document.addEventListener("click", () => {
  // For example, hide your context menu here
  const menu = document.getElementById("folderContextMenu");
  if (menu) menu.style.display = "none";
});

async function createFolderItem(path, isSubfolder = true, parentType = "mixed") {
  const li = document.createElement("li");
  li.className = isSubfolder ? "folderSubItem" : "folderItem";
  li.dataset.path = path;

  const folderName = getFolderName(path);
  const stats = await window.electronAPI.getFolderStats(path);
  const { subfolderCount, songCount, totalBytes } = stats;

  const hasSubfolders = subfolderCount > 0;

  li.innerHTML = `
    <div class="folderListItemDiv">

      <div class="folderItemNCloseBtn">
        <svg class="folderListSvg ${parentType}" viewBox="0 -960 960 960">
          <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h207q16 0 30.5 6t25.5 17l57 57h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Z"/>
        </svg>

        <div class="folderMeta">
          <span class="folderName">${folderName}</span>
          <span class="folderStats">
            ${subfolderCount} subfolders • ${songCount} media files • ${formatSize(totalBytes)}
            <span class="fullPath">${path}</span>
          </span>
        </div>
      </div>

      <div class="folderActions">

        ${hasSubfolders
          ? `<div class="btnExpand" data-path="${path}"><span>▼</span></div>`
          : `<div class="btnExpandPlaceholder"></div>`
        }

        <div class="btnRemove" data-path="${path}">❌</div>
      </div>

    </div>
  `;

  const subtree = document.createElement("ul");
  subtree.className = "folderSubtree";
  subtree.style.display = "none";
  li.appendChild(subtree);

  return li;
}

// initial load
//loadFoldersUI();

// SONG LIST RIGHT-CLICK MENU

const songContextMenu = document.getElementById('songContextMenu');
const contextSongName = document.getElementById('contextSongName');
let selectedSongId = null;

document.addEventListener('contextmenu', (e) => {
    const row = e.target.closest('.songsRow, .songCard, .playlist-item');
    if (!row) return;

    e.preventDefault();
    selectedSongId = row.dataset.id;

    // Song name for the menu
    const nameCol =
        row.querySelector('.songNameCol') ||
        row.querySelector('.songCardTitle') ||
        row.querySelector('.song-name');

    contextSongName.textContent = nameCol?.textContent || "Unknown Song";

    // Detect queue items
    const isQueueItem = row.classList.contains("playlist-item");

    document.querySelectorAll(".queueOnly").forEach(el => {
        el.style.display = isQueueItem ? "block" : "none";
    });

    document.querySelectorAll(".notQueueOnly").forEach(el => {
        el.style.display = isQueueItem ? "none" : "block";
    });

    // ----------------------------------------------------
    // ⭐ FAVORITE MENU ITEM AUTO-SWITCH
    // ----------------------------------------------------

    let isFav = false;

    if (isQueueItem) {
        // 🎧 Playing queue → read invisible "data-fav"
        isFav = row.dataset.fav === "1";
    } 
    else {
        // Normal lists → detect using visual fav icon
        const favCol =
            row.querySelector(".songFavCol") ||
            row.querySelector(".fav-icon") ||
            null;

        isFav = favCol?.classList.contains("fav");
    }

    const favMenu = document.querySelector("#ctxSongAddFav");

    if (isFav) {
        favMenu.dataset.action = "removeFav";
        favMenu.innerHTML = `
            Remove from Favorites
        `;
    } 
    else {
        favMenu.dataset.action = "addFav";
        favMenu.innerHTML = `
            Add to Favorites
        `;
    }

    // ----------------------------------------------------

    // Menu positioning
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    songContextMenu.style.display = 'block';
    songContextMenu.style.visibility = 'hidden';

    const menuW = songContextMenu.offsetWidth;
    const menuH = songContextMenu.offsetHeight;

    songContextMenu.style.visibility = 'visible';

    let posX = e.pageX;
    let posY = e.pageY;

    if (posX + menuW > vw) posX = Math.max(0, vw - menuW - 5);
    if (posY + menuH > vh) posY = Math.max(0, vh - menuH - 5);

    songContextMenu.style.top = `${posY}px`;
    songContextMenu.style.left = `${posX}px`;
    songContextMenu.style.display = 'block';
});


// Hide context menu on clicking elsewhere
document.addEventListener('click', () => {
  songContextMenu.style.display = 'none';
});

// Handle menu clicks
songContextMenu.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('ctx-item')) return;
  if (!selectedSongId) return;

  const action = e.target.dataset.action;

  switch(action) {
    case 'play':
      await playCommand(selectedSongId, currentSongList);
      await loadPlayingQueue();
      break;

      case 'addQueue': {
      const result = await window.electronAPI.addToQueue(selectedSongId);
      if (!result?.success) break;
      await loadPlayingQueue();
      if (result.alreadyExists) {
        showErrorMsg('info',`Already in queue: ${result.title}`);
        return; // ⬅️ stop here
      }
      showErrorMsg('info',`Added to queue: ${result.title}`);
      break;
    }

    case "removeQueue": {
      await window.electronAPI.removeFromQueue(selectedSongId);
      // Remove from UI immediately (no reload required)
      const row = document.querySelector(`.playlist-item[data-id="${selectedSongId}"]`);
      if (row) row.remove();
      break;
    }
   
    case "addFav": {
      //await window.electronAPI.setSongFavorite(selectedSongId, 1);
      const result = await window.electronAPI.setSongFavorite(selectedSongId, 1);
      if (result?.success) {
        const title = result.row.title;
        showErrorMsg("info", `Added to Favorites: ${title}`);
      }
      updateFavoriteIcon(selectedSongId, true);
      const q = document.querySelector(`.playlist-item[data-id="${selectedSongId}"]`);
      if (q) q.dataset.fav = "1";
      break;
    }
    case "removeFav": {
      //await window.electronAPI.setSongFavorite(selectedSongId, 0);
      const result = await window.electronAPI.setSongFavorite(selectedSongId, 0);
      if (result?.success) {
        const title = result.row.title;
        showErrorMsg("info", `Removed from Favorites: ${title}`);
      }
      updateFavoriteIcon(selectedSongId, false);
      const q = document.querySelector(`.playlist-item[data-id="${selectedSongId}"]`);
      if (q) q.dataset.fav = "0";
      break;
    }

    case 'addPlaylist':
      openAddSongToPlaylistDialog(selectedSongId);
      break;

    case 'showExplorer':
      await window.electronAPI.showInExplorer(selectedSongId);
      break;

    case 'info':
      openFileInfo(selectedSongId);
      break;

    case 'goAlbum':
      openSongAlbum(selectedSongId);
      break;

    case 'delete':
        const row = document.querySelector(`.songsRow[data-id="${selectedSongId}"]`);
        const songName = row?.querySelector('.songNameCol')?.textContent || "Unknown Song";

        const confirmed = await confirmDlg(
          `Delete the song <b>${songName}</b> from the library?`, { html: true }
        );

        if (confirmed) {
          const result = await window.electronAPI.deleteSong(selectedSongId);
          if (result.success) {
            await loadSongs();
            showErrorMsg('info', 'Song deleted successfully.');
          } else {
            showErrorMsg('error', `Failed to delete song: ${result.error}`);
          }
        }
        break;
  }

  songContextMenu.style.display = 'none';
});

async function openSongAlbum(songId) {
    if (!songId) return;

    const song = await window.electronAPI.getSongById(songId);
    if (!song) return;

    const albumID = song.albumID;
    if (!albumID) return;

    await openAlbumSongs(albumID);
}

async function refreshSongRow(songId) {
  const row = document.querySelector(`.songsRow[data-id="${songId}"]`);
  if (!row) return; // row not on screen yet

  const song = await window.electronAPI.getSongById(songId);
  if (!song) return;

  // Fallback album art
  const albumArtPath =
    song.albumArt && song.albumArt.trim() !== ""
      ? song.albumArt
      : "images/albumph.png";

  // Update album art
  const artImg = row.querySelector(".songArtCol img");
  if (artImg) artImg.src = albumArtPath;

  // Update text fields
  const t = (v, fallback = "") => (v && v.trim() !== "" ? v : fallback);

  const titleEl = row.querySelector(".songNameCol");
  if (titleEl) titleEl.textContent = t(song.title, song.fileName);

  const artistEl = row.querySelector(".songArtistCol");
  if (artistEl) artistEl.textContent = t(song.artist, "Unknown Artist");

  const albumEl = row.querySelector(".songAlbumCol");
  if (albumEl) albumEl.textContent = t(song.albumName, "Unknown Album");

  const yearEl = row.querySelector(".songYearCol");
  if (yearEl) yearEl.textContent = song.year || "";

  const durationEl = row.querySelector(".songDurationCol");
  if (durationEl) durationEl.textContent = formatDuration(song.duration);

  // Update favorite icon
  const favCol = row.querySelector(".songFavCol");
  if (favCol) {
    const isFav = song.isFavorite === 1 || song.isFavorite === true;

    favCol.classList.toggle("fav", isFav);

    favCol.innerHTML = isFav
      ? `<svg class="heart" viewBox="0 -960 960 960">
        <path d="M480-142.33q-12 0-24.17-4.34Q443.67-151 434.67-160l-58.34-53.67q-118-109-207.16-210.5Q80-525.67 80-640q0-91.33 61.33-152.67 61.34-61.33 152-61.33Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.33Q880-731.33 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9 9-21.16 13.33-12.17 4.34-24.17 4.34Z"/>
      </svg>`
      : `<svg class="heart" viewBox="0 -960 960 960">
        <path d="M480-142.33q-11.8 0-24.02-4.25-12.22-4.25-21.49-13.59l-58.16-53.5q-118-109-207.16-210.5Q80-525.67 80-640q0-91.44 61.33-152.72 61.34-61.28 152-61.28Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.28Q880-731.44 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9.16 9.25-21.25 13.46-12.08 4.21-24.08 4.21Zm-30-543q-27.67-46.34-68-74.17t-88.67-27.83q-64 0-105.33 41.66-41.33 41.67-41.33 105.96 0 55.71 38.25 117.65 38.25 61.93 91.5 120.16T386.5-293.33q56.83 50.33 93.5 84 36.67-33 93.5-83.67t110-109.33Q736.67-461 775-522.96q38.33-61.96 38.33-117.04 0-64-41.66-105.67-41.67-41.66-105-41.66-49 0-89 27.5t-69 74.5q-5.67 8.66-13 12.66-7.34 4-16.34 4t-16.66-4q-7.67-4-12.67-12.66Zm30 187Z"/>
      </svg>`;

  }

  //console.log(`UI refreshed for song ID ${songId}`);
}

// =-=-=-=-=-=-=-=VIDEO LIST=-=-=-=-=-=-=-=-=

let videoViewMode = "list"; // or "grid"

const btnVideoListView = document.getElementById('btnVideoListView');
btnVideoListView.addEventListener("click", async () => {
  videoViewMode = "list";
  document.getElementById("videosListContainer").className = "videosListView";
  document.getElementById("btnVideoListView").classList.add("active");
  document.getElementById("btnVideoGridView").classList.remove("active");
  await loadVideos();
});

const btnVideoGridView = document.getElementById('btnVideoGridView');
btnVideoGridView.addEventListener("click", async () => {
  videoViewMode = "grid";
  document.getElementById("videosListContainer").className = "videosGridView";
  document.getElementById("btnVideoGridView").classList.add("active");
  document.getElementById("btnVideoListView").classList.remove("active");
  await loadVideos();
});

btnVideoGridView.click();

async function loadVideos() {
  const videos = await window.electronAPI.getVideos();

  const container = document.getElementById("videosListContainer");
  container.innerHTML = "";

  const videosTotalNumber = document.getElementById('videosTotalNumber');

  if (videos.length >= 1) {
    if (videos.length == 1) {
      videosTotalNumber.innerText = `1 Video`;
     }
    else {
      videosTotalNumber.innerText = `${videos.length} Videos`;
    }
  }
  else { 
    videosTotalNumber.innerText = `No Videos`;
  }

  if (videoViewMode === "list") {
    videos.forEach(video => {
      const row = document.createElement("div");
      row.className = "videoRow";
      row.dataset.id = video.id;
      row.title = video.title;

      row.innerHTML = `
        <div class="videoThumbWrapper">
            <img src="${video.thumbnail || 'images/albumph.png'}">
            <div class="videoPlayOverlay" data-id="${video.id}">▶</div>
        </div>
        <div class="videoTitleCol">${video.title || "Untitled"}</div>
        <div class="videoDurationCol">${formatDuration(video.duration)}</div>
      `;

      row.addEventListener("dblclick", () => playVideo(video.id));
      row.querySelector(".videoPlayOverlay").addEventListener("click", e => {
        e.stopPropagation();
        playVideo(video.id);
      });

      container.appendChild(row);
    });
  } 
  else {
    videos.forEach(video => {
      const item = document.createElement("div");
      item.className = "videoGridItem";
      item.dataset.id = video.id;
      item.title = video.title;

    item.innerHTML = `
      <div class="videoGridThumbWrapper">
          <img class="videoGridThumb" src="${video.thumbnail || 'images/albumph.png'}">
          <div class="videoGridDuration">${formatDuration(video.duration)}</div>
      </div>
      <div class="videoGridName">${video.title}</div>
    `;
      item.addEventListener("dblclick", () => playVideo(video.id));
      container.appendChild(item);
    });
  }
}

const video = document.getElementById("videoControl");

let videoIsPlaying = false;
let videoIsEnded = false;

async function playVideo(videoId) {
  const videoData = await window.electronAPI.getVideoById(videoId);
  if (!videoData) return;

  showVideoPlayer();

  video.defaultPlaybackRate = 1.0;
  video.playbackRate = 1.0;

  document.querySelectorAll('.videoRow.selected')
    .forEach(el => el.classList.remove('selected'));

  document.querySelector(`.videoRow[data-id="${videoId}"]`)?.classList.add('selected');

  // Reset previous video pipeline
  video.pause();
  video.removeAttribute("src");
  video.load();

  const src = window.electronAPI.toURL(videoData.filePath);
  video.src = src;

  // Wait for decoder ready
  video.addEventListener("canplay", function start() {
    video.removeEventListener("canplay", start);
    video.play().catch(err => console.warn("Autoplay failed:", err));
    videoIsPlaying = true;
    videoDotDiv.classList.add("videoDot"); // <== add here
  });

  // keep sidebar logic in sync
  videoLoaded = true;
  showingVideoPlayer = true;
  lastSection = 'videos';

  // HIDE BARS WHEN PLAYING A VIDEO
  const hideBars = await window.electronAPI.getHideBars();
  if (hideBars) {
    sideBarDiv.classList.add("collapsed");
    sideBarBtn.classList.remove("active");
    playBarDiv.classList.add("collapsed");
    playlistPanel.classList.add("collapsed");
    updateMiddleMargin();
  }
}

video.addEventListener("play", () => {
  videoIsPlaying = true;
  videoDotDiv.classList.add("videoDot");
  videoIsEnded = false
});

video.addEventListener("pause", () => {
  videoDotDiv.classList.remove("videoDot");
  videoIsPlaying = false;
});

video.addEventListener("ended", () => {
  videoDotDiv.classList.remove("videoDot");
  videoIsPlaying = false;
  videoIsEnded = true;
});

/* setInterval(() => {
  console.log("dropped:", video.getVideoPlaybackQuality().droppedVideoFrames);
}, 2000); */

function showVideoPlayer() {
  // hide EVERY screen: artists, albums, playlists, videos list, etc
  allScreens.forEach(div => div.style.display = 'none');

  const playerDiv = document.getElementById('videoPlayerDiv');
  playerDiv.style.display = 'block';
  playerDiv.classList.add('visible');

  document.getElementById('videosSideBtn').classList.add('activeBtn');
}

function showVideoList() {
  const playerDiv = document.getElementById('videoPlayerDiv');
  const listDiv = document.getElementById('videosContentDiv');

  playerDiv.style.display = 'none';
  playerDiv.classList.remove('visible');

  // hide EVERYTHING
  allScreens.forEach(div => div.style.display = 'none');

  listDiv.style.display = 'block';

  document.getElementById('videosSideBtn').classList.add('activeBtn');
}

const sideBarBtn = document.getElementById("sideBarBtn");
const sideBarDiv = document.getElementById("sideBarDiv");

const playBarDiv = document.getElementById('playBarDiv');

sideBarBtn.addEventListener("click", () => {
  sideBarDiv.classList.toggle("collapsed");
  sideBarBtn.classList.toggle("active");
  playBarDiv.classList.toggle("collapsed");
  playlistPanel.classList.toggle("collapsed");
  updateMiddleMargin();
});

const dragBar = document.getElementById('dragBar');
const playBar = document.getElementById('playBarDiv');
const content = document.getElementById('middleNSideDiv');
const fakeBar  = document.getElementById('fakeBar');

let isDragging = false;
let prevHeight = playBar.offsetHeight || 120;

const MAX_HEIGHT = 120;
const MIN_HEIGHT = 0;
const SNAP_THRESHOLD = 20;

function applyHeight(h, remember = true) {
  const clamped = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, h));
  playBar.style.height = `${clamped}px`;
  content.style.bottom = `${clamped}px`;
  dragBar.style.bottom = `${clamped}px`;
  fakeBar.style.bottom = `${clamped}px`;
  if (remember && clamped > 0) prevHeight = clamped;
}

dragBar.addEventListener('mousedown', () => {
  isDragging = true;
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'ns-resize';  // 👈 keep resize cursor globally
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const windowHeight = window.innerHeight;
  const newHeight = windowHeight - e.clientY;
  applyHeight(newHeight);
});

document.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  document.body.style.cursor = 'default';
  document.body.style.userSelect = '';
  if (playBar.offsetHeight < SNAP_THRESHOLD) {
    applyHeight(0, false);
  }
});

// Reliable double-click toggle
dragBar.addEventListener('click', () => {
  const current = playBar.offsetHeight;
  if (current <= SNAP_THRESHOLD) {
    applyHeight(MAX_HEIGHT);
  } 
  else {
    applyHeight(0);
  }
});

// VIDEO LIST RIGHT-CLICK MENU 

const videoContextMenu = document.getElementById('videoContextMenu');
const contextVideoName = document.getElementById('contextVideoName');
let selectedVideoId = null;

// Attach context menu to video list container
document.getElementById('videosListContainer').addEventListener('contextmenu', (e) => {
  const row = e.target.closest('.videoRow, .videoGridItem');
  if (!row) return;

  e.preventDefault();

  selectedVideoId = row.dataset.id;
  const videoName =
    row.querySelector('.videoTitleCol')?.textContent ||
    row.querySelector('.videoGridName')?.textContent ||
    'Unknown Video';

  contextVideoName.textContent = videoName;

  // Get viewport size
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Make visible to measure
  videoContextMenu.style.display = 'block';
  videoContextMenu.style.visibility = 'hidden';

  const menuWidth = videoContextMenu.offsetWidth;
  const menuHeight = videoContextMenu.offsetHeight;

  videoContextMenu.style.visibility = 'visible';

  // Calculate safe position
  let posX = e.pageX;
  let posY = e.pageY;

  if (posX + menuWidth > viewportWidth) {
    posX = Math.max(0, viewportWidth - menuWidth - 5);
  }
  if (posY + menuHeight > viewportHeight) {
    posY = Math.max(0, viewportHeight - menuHeight - 5);
  }

  videoContextMenu.style.top = `${posY}px`;
  videoContextMenu.style.left = `${posX}px`;
  videoContextMenu.style.display = 'block';
});

// Hide context menu on click elsewhere
document.addEventListener('click', () => {
  videoContextMenu.style.display = 'none';
});

// Handle context menu actions
videoContextMenu.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('ctx-item')) return;
  if (!selectedVideoId) return;

  const action = e.target.dataset.action;

  switch (action) {
    case 'play':
      playVideo(selectedVideoId);
      break;

    case 'showExplorer':
      //await window.electronAPI.showInExplorer(selectedVideoId, 'video');
      await window.electronAPI.showVideoInExplorer(selectedVideoId);
      break;

    case 'info':
      openVideoInfo(selectedVideoId);
      break;

    case 'delete':
      // Get video name for confirmation
      const row = document.querySelector(
        `.videoRow[data-id="${selectedVideoId}"], .videoGridItem[data-id="${selectedVideoId}"]`
      );

      const videoName =
        row?.querySelector('.videoTitleCol')?.textContent ||
        row?.querySelector('.videoGridName')?.textContent ||
        "Unknown Video";

      const confirmed = await confirmDlg(
        `Delete the video <b>${videoName}</b> from the library?`, { html: true}
      );

      if (confirmed) {
        const result = await window.electronAPI.deleteVideo(selectedVideoId);
        if (result.success) {
          await loadVideos();
          showErrorMsg('info', 'Video deleted successfully.');
        } 
        else {
          showErrorMsg('error', `Failed to delete video: ${result.error}`);
        }
      }
      break;
  }

  videoContextMenu.style.display = 'none';
});

// PLAYLISTS PAGE

let currentPlaylistList = [];
let currentPlaylistSort = "added_asc";

async function loadPlaylists() {
  const container = document.getElementById("playlistsContent");
  container.innerHTML = "";

  const favoritesCount = await window.electronAPI.getFavoritesCount();
  const historyCount = await window.electronAPI.getHistoryCount();

  // --- Fixed playlists (ALWAYS FIRST) ---
  const fixedPlaylists = [
    {
      id: "favorites",
      name: "Favorites",
      image: "images/playlist_favorites.png",
      count: favoritesCount
    },
    {
      id: "history",
      name: "History",
      image: "images/playlist_history.png",
      count: historyCount
    }
  ];

  fixedPlaylists.forEach(pl => {
    const div = document.createElement("div");
    div.className = "playlistItem";
    div.dataset.id = pl.id;

    div.innerHTML = `
      <img class="playlistImage" src="${pl.image}">
      <div class="playlistName">${pl.name}</div>
      <div class="playlistCount">${pl.count} ${pl.count === 1 ? "song" : "songs"}</div>
    `;

    div.addEventListener("click", () => openPlaylist(pl.id));
    container.appendChild(div);
  });

  // --- Custom playlists ---
  const userPlaylists = await window.electronAPI.getAllPlaylists();
  currentPlaylistList = userPlaylists;

  updatePlaylistsTotal(userPlaylists.length);

  const savedSort = (await window.electronAPI.getPlaylistsSort()) || "added_asc";
  setActiveSortOptionPlaylist(savedSort);
  sortPlaylists(savedSort);
}

function updatePlaylistsTotal(count) {
  const el = document.getElementById("playlistsTotalNumber");

  if (count === 0) el.innerText = "No Playlists";
  else if (count === 1) el.innerText = "1 Playlist";
  else el.innerText = `${count} Playlists`;
}

function renderCustomPlaylists() {
  const container = document.getElementById("playlistsContent");

  currentPlaylistList.forEach(pl => {
    const div = document.createElement("div");
    div.className = "playlistItem";
    div.dataset.id = pl.id;

    div.innerHTML = `
      <img class="playlistImage" src="${pl.thumbnail || "images/plist.png"}">
      <div class="playlistName">${pl.name}</div>
      <div class="playlistCount">${pl.count} ${pl.count === 1 ? "song" : "songs"}</div>
    `;

    div.addEventListener("click", () => openPlaylist(pl.id));
    container.appendChild(div);
  });
}

function sortPlaylists(sortKey) {
  currentPlaylistSort = sortKey;

  switch (sortKey) {
    case "title_asc":
      currentPlaylistList.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      break;

    case "title_desc":
      currentPlaylistList.sort((a, b) =>
        b.name.localeCompare(a.name)
      );
      break;

    case "added_asc":
      currentPlaylistList.sort((a, b) => a.id - b.id);
      break;

    case "added_desc":
      currentPlaylistList.sort((a, b) => b.id - a.id);
      break;
  }

  // Remove only custom playlists from DOM
  document
    .querySelectorAll("#playlistsContent .playlistItem")
    .forEach(el => {
      if (el.dataset.id !== "favorites" && el.dataset.id !== "history") {
        el.remove();
      }
    });

  renderCustomPlaylists();
}

//--------------------------------------------

const sortBtnPlaylists = document.getElementById("sortBtnPlaylists");
const sortDropdownPlaylists = document.getElementById("sortDropdownPlaylists");

sortBtnPlaylists.addEventListener('click', () => {
  sortDropdownPlaylists.style.display = sortDropdownPlaylists.style.display === 'block' ? 'none' : 'block';
});

document.querySelectorAll("#sortDropdownPlaylists .sortOption").forEach(option => {
  option.addEventListener("click", async () => {
    const sortKey = option.dataset.sort;
    setActiveSortOptionPlaylist(sortKey);
    await window.electronAPI.setPlaylistsSort(sortKey);
    sortPlaylists(sortKey);
    sortDropdownPlaylists.style.display = 'none';
  });
});

// Hide dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!sortBtnPlaylists.contains(e.target) && !sortDropdownPlaylists.contains(e.target)) {
    sortDropdownPlaylists.style.display = 'none';
  }
});

function setActiveSortOptionPlaylist(sortKey) {
  document.querySelectorAll('#sortDropdownPlaylists .sortOption').forEach(o => o.classList.remove('active'));
  const opt = document.querySelector(`#sortDropdownPlaylists .sortOption[data-sort="${sortKey}"]`);
  if (opt) opt.classList.add('active');
}

// ---------- ARTISTS ----------

async function loadArtists() {
  const artists = await window.electronAPI.getArtists();
  const container = document.getElementById("artistsContent");
  const topBar = document.querySelector(".artistsTopBar");
  container.innerHTML = "";

  if (artists.length >= 1) {
    if (artists.length == 1) {
      topBar.textContent = `1 Artist`;
     }
    else {
      topBar.textContent = `${artists.length} Artists`;
    }
  }
  else { 
    topBar.textContent = `No Artists`;
  }

  artists.forEach(a => {
    const arts = a.albumArts || [];
    const item = document.createElement("div");
    item.className = "artistItem";
    item.dataset.id = a.id;
    item.dataset.type = "artist";

    // Determine layout HTML
    let artHTML = "";
    if (arts.length >= 4) {
      artHTML = `
        <div class="artistCollage four">
          <img src="${arts[0]}" alt="">
          <img src="${arts[1]}" alt="">
          <img src="${arts[2]}" alt="">
          <img src="${arts[3]}" alt="">
        </div>`;
    } 
    else if (arts.length === 3) {
      artHTML = `
        <div class="artistCollage three">
          <div class="top">
            <img src="${arts[0]}" alt="">
            <img src="${arts[1]}" alt="">
          </div>
          <div class="bottom">
            <img src="${arts[2]}" alt="">
          </div>
        </div>`;
    } 
    else if (arts.length === 2) {
      artHTML = `
        <div class="artistCollage two">
          <img src="${arts[0]}" alt="">
          <img src="${arts[1]}" alt="">
        </div>`;
    } 
    else if (arts.length === 1) {
      artHTML = `
        <div class="artistCollage one">
          <img src="${arts[0]}" alt="">
        </div>`;
    } 
    else {
      artHTML = `
        <div class="artistCollage placeholder">
          <img src="images/artistph.png" alt="">
        </div>`;
    }

    item.innerHTML = `
      ${artHTML}
      <div class="playlistName">${a.name}</div>
    `;

    item.addEventListener("click", () => {
      openArtistSongs(a.id);
    });

    container.appendChild(item);
  });
}

// ---------- ALBUMS ----------

async function loadAlbums() {
  const albums = await window.electronAPI.getAlbums();
  const container = document.getElementById("albumsContent");
  const topBar2 = document.querySelector(".albumsTopBar");
  container.innerHTML = "";

  if (albums.length >= 1) {
    if (albums.length == 1) {
      topBar2.textContent = `1 Album`;
     }
    else {
      topBar2.textContent = `${albums.length} Albums`;
    }
  }
  else { 
    topBar2.textContent = `No Albums`;
  }

  albums.forEach(a => {
    const cover = a.albumArt && a.albumArt.trim() !== "" ? a.albumArt : "images/discph.png";
    const item = document.createElement("div");
    item.className = "mediaGridItem";
    item.innerHTML = `
      <img class="mediaGridImage" src="${cover}" alt="">
      <div class="mediaGridName">${a.name}</div>
      <div class="mediaGridSub">${a.artistName || "Unknown Artist"}</div>
    `;
    item.addEventListener("click", () => {
      openAlbumSongs(a.id);
    });
    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      mediaCtxTarget = a;
      mediaCtxType = "album";
      openMediaContextMenu(e.clientX, e.clientY, a.name);
    });
    container.appendChild(item);
  });
}

// ---------- GENRES ---------- 

async function loadGenres() {
  const genres = await window.electronAPI.getGenres();
  const container = document.getElementById("genresContent");
  const topBar3 = document.querySelector(".genresTopBar");
  container.innerHTML = "";

  if (genres.length >= 1) {
    if (genres.length == 1) {
      topBar3.textContent = `1 Genre`;
     }
    else {
      topBar3.textContent = `${genres.length} Genres`;
    }
  }
  else { 
    topBar3.textContent = `No Genres`;
  }

  // Color map for specific genres
  const genreColors = {
    // 🎸 Rock & Subgenres
    "classic rock": "#575099FF",
    "alt. rock": "#3f3d56",
    "alternative rock": "#3f3d56",
    "alternative": "#4b4b8f",
    "post grunge": "#424277FF",
    "post-grunge": "#424277FF",
    "grunge": "#805012FF",
    "rock nacional": "#0D8869FF",
    "punk rock": "#66101f",
    "hardcore punk": "#8d0801",
    "punk": "#8d0801",

    // 🤘 Metal Family
    "nu-metal": "#5f0f40",
    "numetal": "#5f0f40",
    "heavy metal": "#770c0cff",
    "thrash metal": "#240046",
    "alternative metal": "#5e548e",
    "rap metal": "#7b2cbf",
    "punk metal": "#933d7a",
    "black metal": "#000000",
    "death metal": "#2b2d42",
    "groove": "#312244",

    // 🎤 Hip-Hop & Rap
    "hip hop": "#ff9f1c",
    "hip-hop": "#ff9f1c",
    "rap": "#ff7f11",
    "rap metal": "#7b2cbf",

    // 🎶 Folk & Acoustic
    "folk": "#ffb703",
    "folk-rock": "#f8961e",
    "acoustic": "#e9c46a",

    // 🌈 Dance, Funk & Disco
    "disco": "#ff4d6d",
    "funk": "#ff8fab",
    "pop": "#f72585",

    // 🌎 Latin & MPB
    "latin": "#f3722c",
    "mpb": "#2BB119FF",

    // 🎧 Misc
    "genre": "#666666",
    "other": "#555555",

    "music": "yellow",
    "rock": "#000000FF",
    "hard rock": "#3a0ca3",
    "metal": "#FF0000FF",
    "jazz": "#3c6e71",
    "blues": "#1a659e",
    "electronic": "#06d6a0",
    "edm": "#118ab2",
    "house": "#00b4d8",
    "techno": "#0077b6",
    "classical": "#9b5de5",
    "folk": "#ffb703",
    "country": "#fb8500",
    "reggae": "#008000",
    "punk": "#8d0801",
    "indie": "#8338ec",
    "soundtrack": "#4361ee",
    "alternative": "#7209b7",
    "r&b": "#c77dff"
  };

  genres.forEach(g => {
    const item = document.createElement("div");
    item.className = "genreItem";

    const img = document.createElement("img");
    img.src = g.albumArts && g.albumArts.length > 0 ? g.albumArts[0] : "images/genreph.png";
    img.className = "genreImage";

    const infoDiv = document.createElement("div");
    infoDiv.className = "genreInfo";

    const nameDiv = document.createElement("div");
    nameDiv.className = "genreName";
    nameDiv.textContent = g.name;

    const countDiv = document.createElement("div");
    countDiv.className = "genreCount";
    countDiv.textContent = `${g.songCount || 0} Song${g.songCount === 1 ? "" : "s"}`;

    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(countDiv);

    item.appendChild(img);
    item.appendChild(infoDiv);

    // Set genre-specific color or default fallback
    let color = genreColors[g.name.toLowerCase()] || "#444";
    if (g.albumArts && g.albumArts.length > 0) {
      item.style.background = `linear-gradient(135deg, ${color}, #252525FF)`;
    } 
    else {
      item.style.background = "rgb(35, 35, 35)";
    }

    item.addEventListener("click", () => {
      openGenreSongs(g.id);
    });

    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      mediaCtxTarget = g;
      mediaCtxType = "genre";
      openMediaContextMenu(e.clientX, e.clientY, g.name);
    });

    container.appendChild(item);
  });
}

function openMediaContextMenu(x, y, title) {
  const menu = document.getElementById("mediaContextMenu");
  const titleDiv = document.getElementById("ctxMediaTitle");

  titleDiv.textContent = title;
  menu.style.top = `${y}px`;
  menu.style.left = `${x}px`;
  menu.style.display = "block";
}

document.addEventListener("click", () => {
    document.getElementById("mediaContextMenu").style.display = "none";
});

document.getElementById("mediaContextMenu").addEventListener("click", async (e) => {
  const action = e.target.dataset.action;
  if (!action || !mediaCtxTarget) return;

  const id = mediaCtxTarget.id;

  const menu = document.getElementById("mediaContextMenu");

  async function getArtistSongs() {
    const result = await window.electronAPI.getSongsByArtist(id);
    return extractSongs(result);
  }
  async function getAlbumSongs() {
    const result = await window.electronAPI.getSongsByAlbum(id);
    return extractSongs(result);
  }
  async function getGenreSongs() {
    const result = await window.electronAPI.getSongsByGenre(id);
    return extractSongs(result);
  }

  switch (mediaCtxType) {

      // ═══════════════ ARTISTS ═══════════════
      case "artist": {
          if (action === "playAll") {
              const songs = await getArtistSongs();
              await playSongList(songs);
          }
          else if (action === "shufflePlay") {
              const songs = await getArtistSongs();
              await shufflePlayList(songs);
          }
          else if (action === "addQueue") {
              const songs = await getArtistSongs();
              await addListToQueue(songs);
          }
          else if (action === "savePL") {
              const songs = await getArtistSongs();
              await openSaveAAGAsPlaylistDialog(songs);
          }
          else if (action === "addPL") {
              const songs = await getArtistSongs();
              await openAddAAGSongsToPlaylistDialog(songs);
          }
          else if (action === "info") {
              showMediaInfo("Artist", mediaCtxTarget);
          }
          break;
      }

      // ═══════════════ ALBUMS ═══════════════
      case "album": {
          if (action === "playAll") {
              const songs = await getAlbumSongs();
              await playSongList(songs);
          }
          else if (action === "shufflePlay") {
              const songs = await getAlbumSongs();
              await shufflePlayList(songs);
          }
          else if (action === "addQueue") {
              const songs = await getAlbumSongs();
              await addListToQueue(songs);
          }
          else if (action === "savePL") {
              const songs = await getAlbumSongs();
              await openSaveAAGAsPlaylistDialog(songs);
          }
          else if (action === "addPL") {
              const songs = await getAlbumSongs();
              await openAddAAGSongsToPlaylistDialog(songs);
          }
          else if (action === "info") {
              showMediaInfo("Album", mediaCtxTarget);
          }
          break;
      }

      // ═══════════════ GENRES ═══════════════
      case "genre": {
          if (action === "playAll") {
              const songs = await getGenreSongs();
              await playSongList(songs);
          }
          else if (action === "shufflePlay") {
              const songs = await getGenreSongs();
              await shufflePlayList(songs);
          }
          else if (action === "addQueue") {
              const songs = await getGenreSongs();
              await addListToQueue(songs);
          }
          else if (action === "savePL") {
              const songs = await getGenreSongs();
              await openSaveAAGAsPlaylistDialog(songs);
          }
          else if (action === "addPL") {
              const songs = await getGenreSongs();
              await openAddAAGSongsToPlaylistDialog(songs);
          }
          else if (action === "info") {
              showMediaInfo("Genre", mediaCtxTarget);
          }
          break;
      }
  }

  menu.style.display = "none";
});

async function openSaveAAGAsPlaylistDialog(songList) {
    let defaultName = "New Playlist";

    // If it's a DOM element
    if (mediaCtxTarget instanceof HTMLElement) {
        defaultName =
            mediaCtxTarget.dataset?.name ||
            mediaCtxTarget.querySelector(".title")?.innerText ||
            "New Playlist";
    }
    // If it's an object with name field
    else if (mediaCtxTarget && typeof mediaCtxTarget === "object") {
        defaultName = mediaCtxTarget.name || "New Playlist";
    }

    dlgInputPL.value = defaultName;

    // Reset image
    dlgImgPL.src = "images/albumph.png";
    dlgImgPL.dataset.base64 = "";

    // Queue-save mode
    dlgPL.dataset.queueSaveMode = "1";
    dlgPL._queueSongIDs = songList.map(s => s.id);

    dlgPL.style.display = "block";
}

async function openAddAAGSongsToPlaylistDialog(songList) {
    addToPlaylist_Selected.clear();
    const list = document.getElementById("addQueueToPlaylist_List");

    addQueueToPlaylistDlg.style.display = "flex";
    list.innerHTML = "";

    // Store temporary array
    addQueueToPlaylistDlg._AAGSongIDs = songList.map(s => s.id);

    const playlists = await window.electronAPI.getAllPlaylists();

    playlists.forEach(pl => {
        const div = document.createElement("div");
        div.className = "playlistItem addToPlaylistItem";
        div.dataset.id = pl.id;

        div.innerHTML = `
            <img class="playlistImage" src="${pl.thumbnail || "images/albumph.png"}">
            <div class="playlistName">${pl.name}</div>
            <div class="playlistCount">${pl.count} ${pl.count === 1 ? "song" : "songs"}</div>
        `;

        div.addEventListener("click", () => {
            const id = pl.id;
            if (addToPlaylist_Selected.has(id)) {
                addToPlaylist_Selected.delete(id);
                div.classList.remove("selected");
            } else {
                addToPlaylist_Selected.add(id);
                div.classList.add("selected");
            }
        });

        list.appendChild(div);
    });
}

async function playSongList(list) {
  if (!list || list.length === 0) return;

  const queue = list.map(s => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      album: s.albumName,
      year: s.year,
      cover: s.albumArt,
      duration: s.duration,
      filePath: s.filePath
  }));

  const queueData = {
      queue,
      currentIndex: 0,
      currentSong: queue[0]
  };

  await window.electronAPI.setPlayingQueue(queueData);
  await playCommand(queue[0].id, null);
  await loadPlayingQueue();
}

async function shufflePlayList(list) {
    if (!list || list.length === 0) return;

    const shuffled = [...list];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    await playSongList(shuffled);
}

async function addListToQueue(list) {
  const ids = list.map(s => s.id).filter(Boolean);
  if (ids.length === 0) return;

  const result = await window.electronAPI.addSongsToQueue(ids);

  if (result?.success) {
    await loadPlayingQueue();

    const messages = [];

    if (result.added > 0) {
      messages.push(`Added ${result.added} song(s) to queue`);
    }

    if (result.alreadyInQueue > 0) {
      messages.push(`${result.alreadyInQueue} already in the queue`);
    }

    if (result.failed > 0) {
      messages.push(`${result.failed} failed`);
    }

    if (messages.length > 0) {
      showErrorMsg("info", messages.join(" · ") + ".");
    }
  } 
  else {
    showErrorMsg(
      "error",
      `Failed to add songs: ${result?.error || "unknown"}`
    );
  }
}


function showMediaInfo(type, data) {
  showErrorMsg("info", `${type} Info: ${data.name}`);
}

function extractSongs(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.songs)) return result.songs;
  return [];
}

//------- CATEGORY LISTS -------------

let currentCategorySongs = [];
let currentCategorySort = "added_asc";

function sortCategorySongs(sortKey) {
  currentCategorySort = sortKey;

  currentCategorySongs.sort((a, b) => {
    switch (sortKey) {
      case "added_desc":
        return new Date(b.addedDate) - new Date(a.addedDate);
      case "added_asc":
        return new Date(a.addedDate) - new Date(b.addedDate);
      case "plays_desc":
        return (b.playCounter || 0) - (a.playCounter || 0);
      case "plays_asc":
        return (a.playCounter || 0) - (b.playCounter || 0);
      case "title_asc":
        return (a.title || "").localeCompare(b.title || "");
      case "title_desc":
        return (b.title || "").localeCompare(a.title || "");
      case "artist_asc":
        return (a.artist || "").localeCompare(b.artist || "");
      case "artist_desc":
        return (b.artist || "").localeCompare(a.artist || "");
      case "albumName_asc":
        return (a.albumName || "").localeCompare(b.albumName || "");
      case "albumName_desc":
        return (b.albumName || "").localeCompare(a.albumName || "");
      default:
        return 0;
    }
  });

  const list = document.getElementById("categorySongsList");
  renderSongsList(list, currentCategorySongs);
}

const sortBtnCategory = document.getElementById("sortBtnCategory");
const sortDropdownCategory = document.getElementById("sortDropdownCategory");

sortBtnCategory.addEventListener("click", () => {
  sortDropdownCategory.style.display =
    sortDropdownCategory.style.display === "block" ? "none" : "block";
});

document
  .querySelectorAll("#sortDropdownCategory .sortOption")
  .forEach(option => {
    option.addEventListener("click", async () => {
      const sortKey = option.dataset.sort;

      setActiveSortOptionCategory(sortKey);
      await window.electronAPI.setCategorySongsSort(sortKey);

      sortCategorySongs(sortKey);
      sortDropdownCategory.style.display = "none";
    });
  });

// Close when clicking outside
document.addEventListener("click", e => {
  if (
    !sortBtnCategory.contains(e.target) &&
    !sortDropdownCategory.contains(e.target)
  ) {
    sortDropdownCategory.style.display = "none";
  }
});

function setActiveSortOptionCategory(sortKey) {
  document
    .querySelectorAll("#sortDropdownCategory .sortOption")
    .forEach(o => o.classList.remove("active"));

  const opt = document.querySelector(
    `#sortDropdownCategory .sortOption[data-sort="${sortKey}"]`
  );

  if (opt) opt.classList.add("active");
}


// Utility to render song list (for Artists / Albums / Genres)

function renderSongsList(container, songs) {
  container.innerHTML = `
    <div class="songsHeader songsRow header">
      <div class="songArtCol"></div>
      <div class="songNameCol">Name</div>
      <div class="songArtistCol">Artist</div>
      <div class="songAlbumCol">Album</div>
      <div class="songYearCol">Year</div>
      <div class="songFavCol"></div>
      <div class="songDurationCol">Time</div>
    </div>
  `;

  const filledHeart = `
    <svg class="heart" viewBox="0 -960 960 960">
      <path d="M480-142.33q-12 0-24.17-4.34Q443.67-151 434.67-160l-58.34-53.67q-118-109-207.16-210.5Q80-525.67 80-640q0-91.33 61.33-152.67 61.34-61.33 152-61.33Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.33Q880-731.33 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9 9-21.16 13.33-12.17 4.34-24.17 4.34Z"/>
    </svg>
  `;

  const emptyHeart = `
    <svg class="heart" viewBox="0 -960 960 960">
      <path d="M480-142.33q-11.8 0-24.02-4.25-12.22-4.25-21.49-13.59l-58.16-53.5q-118-109-207.16-210.5Q80-525.67 80-640q0-91.44 61.33-152.72 61.34-61.28 152-61.28Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.28Q880-731.44 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9.16 9.25-21.25 13.46-12.08 4.21-24.08 4.21Zm-30-543q-27.67-46.34-68-74.17t-88.67-27.83q-64 0-105.33 41.66-41.33 41.67-41.33 105.96 0 55.71 38.25 117.65 38.25 61.93 91.5 120.16T386.5-293.33q56.83 50.33 93.5 84 36.67-33 93.5-83.67t110-109.33Q736.67-461 775-522.96q38.33-61.96 38.33-117.04 0-64-41.66-105.67-41.67-41.66-105-41.66-49 0-89 27.5t-69 74.5q-5.67 8.66-13 12.66-7.34 4-16.34 4t-16.66-4q-7.67-4-12.67-12.66Zm30 187Z"/>
    </svg>
  `;

  songs.forEach(song => {
    const albumArtPath = song.albumArt?.trim()
      ? song.albumArt
      : "images/albumph.png";

    const row = document.createElement("div");
    row.className = "songsRow";
    row.dataset.id = song.id;

    row.innerHTML = `
      <div class="songArtCol">
        <div class="albumArtWrapper">
          <img src="${albumArtPath}" alt="">
          <div class="playOverlay" data-id="${song.id}">▶</div>
        </div>
      </div>
      <div class="songNameCol">${song.title || song.fileName}</div>
      <div class="songArtistCol">${song.artist || "Unknown"}</div>
      <div class="songAlbumCol">${song.albumName || "Unknown"}</div>
      <div class="songYearCol">${song.year || ""}</div>
      
      <div class="songFavCol ${song.isFavorite ? "fav" : ""}">
        ${song.isFavorite ? filledHeart : emptyHeart}
      </div>

      <div class="songDurationCol">${formatDuration(song.duration)}</div>
    `;

    // --- FAVORITE CLICK HANDLER (FIXED) ---
    const favEl = row.querySelector(".songFavCol");
    favEl.addEventListener("click", async (e) => {
      e.stopPropagation();

      const newStatus = !favEl.classList.contains("fav");

      //await window.electronAPI.setSongFavorite(song.id, newStatus ? 1 : 0);
      const result = await window.electronAPI.setSongFavorite(song.id, newStatus ? 1 : 0);
      if (result?.success) {
        const title = result.row.title;
        if (newStatus) {
          showErrorMsg("info", `Added to Favorites: ${title}`);
        } 
        else {
          showErrorMsg("info", `Removed from Favorites: ${title}`);
        }
      }
      favEl.classList.toggle("fav", newStatus);
      favEl.innerHTML = newStatus ? filledHeart : emptyHeart;
    });

    // Double-click play
    row.addEventListener("dblclick", async (e) => {
      if (e.target.closest(".songFavCol")) return;

      document.querySelectorAll(".songsRow.selectedRow")
        .forEach(r => r.classList.remove("selectedRow"));

      row.classList.add("selectedRow");

      await playCommand(song.id, currentSongList);
      await loadPlayingQueue();
    });

    // Play button
    row.querySelector(".playOverlay").addEventListener("click", async (e) => {
      e.stopPropagation();
      await playCommand(song.id, currentSongList);
      await loadPlayingQueue();
    });

    container.appendChild(row);
  });
}

async function openArtistSongs(artistID) {
  const { name, songs } = await window.electronAPI.getSongsByArtist(artistID);
  showCategorySongs(`Artist: ${name}`, songs);
}

async function openAlbumSongs(albumID) {
  const { name, songs } = await window.electronAPI.getSongsByAlbum(albumID);
  showCategorySongs(`Album: ${name}`, songs);
}

async function openGenreSongs(genreID) {
  const { name, songs } = await window.electronAPI.getSongsByGenre(genreID);
  showCategorySongs(`Genre: ${name}`, songs);
}

async function showCategorySongs(title, songs) {
  currentSongList = songs;           // playback queue
  currentCategorySongs = [...songs]; // category working list

  const savedSort =
    (await window.electronAPI.getCategorySongsSort()) || "added_asc";

  setActiveSortOptionCategory(savedSort);
  sortCategorySongs(savedSort);

  const visibleDiv = document.querySelector(
    '.middleContentItems:not([style*="display: none"])'
  );
  if (visibleDiv) lastVisiblePage = visibleDiv.id;

  document
    .querySelectorAll('.middleContentItems')
    .forEach(div => div.style.display = "none");

  const div = document.getElementById("categorySongsDiv");
  document.getElementById("categorySongsTitle").textContent = title;

  div.style.display = "block";
}


document.getElementById("backToLibraryBtn").addEventListener("click", () => {
  document.getElementById("categorySongsDiv").style.display = "none";

  // Return to the last page or fallback to main songs list
  if (lastVisiblePage) {
    document.getElementById(lastVisiblePage).style.display = "block";
  } 
  else {
    document.getElementById("songsContentDiv").style.display = "block"; // fallback
  }

  // Reset it to prevent loops
  lastVisiblePage = null;
});

// --------- SETTINGS ------------- 

let hotkeys = {};


async function initHotkeys() {
  hotkeys = await window.electronAPI.getHotkeys();

  window.addEventListener('keydown', async (e) => {

    // Ignore hotkeys when typing in inputs or editable fields
    const el = document.activeElement;

    if (el && (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable
    )) {
      return; // ← do nothing (allow typing normally)
    }

    //console.log("KEY", e.code);
    const key = e.code;

    if (key === hotkeys.playPause) {
      e.preventDefault();
      playPauseBtn.click();
    }
    else if (key === hotkeys.nextTrack) {
      e.preventDefault();
      nextBtnDiv.click();
    }
    else if (key === hotkeys.prevTrack) {
      e.preventDefault();
      prevBtnDiv.click();
    }
    else if (key === hotkeys.foward10) {
      e.preventDefault();
      seekBy(10);
    }
    else if (key === hotkeys.back10) {
      e.preventDefault();
      seekBy(-10);
    }
    else if (key === hotkeys.fullScreen) {
      e.preventDefault();
    }
    else if (key === hotkeys.mute) {
      e.preventDefault();
      volumeBtnDiv.click();
    }    
    else if (key === hotkeys.volumeUp) {
      e.preventDefault();
      changeVolumeBy(maxVolume * 0.02);
    }
    else if (key === hotkeys.volumeDown) {
      e.preventDefault();
      changeVolumeBy(-maxVolume * 0.02);
    }
    else if (key === hotkeys.reloadApp) {
      e.preventDefault();
      await window.electronAPI.hardReload();
    }
  });
}

initHotkeys();

// ----------------- PLAYING QUEUE ----------------

async function loadPlayingQueue() {
  const queueData = await window.electronAPI.getPlayingQueue();

  updateQueuePanel(queueData);

  // If there’s a current song saved, load it into the player
  if (queueData && queueData.currentSong) {
    currentSongId = queueData.currentSong.id;
    highlightCurrentSong(currentSongId);

    // Update UI (cover, title, etc.)
    const song = queueData.currentSong;
    playBarAlbumCover.classList.remove("hidden");
    playBarAlbumCover.src = song.albumArt || "images/albumph.png";
    songNameDiv.innerText = song.title;
    artistNameDiv.innerText = song.artist;
    albumNameDiv.innerText = song.albumName;

    const songIsFav = await window.electronAPI.getFavoriteStatus(currentSongId);
    // After currentSong is updated
    if (currentSongId && typeof songIsFav !== "undefined") {
      setPlaybarFavorite(!!songIsFav);
    }
    updateAddToPlaylistIcon(currentSongId);   // ⬅ ADD THIS
  }

  loadRepeatMode();
}



loadPlayingQueue();

function updateQueuePanel(queueData) {
  const playlist = document.getElementById("playlist");
  playlist.innerHTML = "";

  if (!queueData || !queueData.queue) return;

  const { queue, currentIndex } = queueData;

  queue.forEach((song, idx) => {
    const isCurrent = idx === currentIndex;
    const item = createQueueItem(song, isCurrent);
    playlist.appendChild(item);
  });
}

function createQueueItem(song, isCurrent = false) {
  const div = document.createElement("div");
  div.className = `playlist-item ${isCurrent ? "current" : ""}`;
  div.dataset.id = song.id; // store song id for highlighting
  div.dataset.fav = song.isFavorite ? "1" : "0";
  div.title = `${song.title}`;

  div.innerHTML = `
    <img src="${song.albumArt || song.cover || 'images/albumph.png'}" alt="">
    <div class="song-info">
      <div class="song-name">${song.title || song.fileName}</div>
      <div class="artist-name">${song.artist || "Unknown Artist"}</div>
    </div>
    <div class="duration">${formatDuration(song.duration)}</div>
  `;

  // 🎵 Double click to play song in queue
  div.addEventListener("dblclick", async () => {
    await playCommand(song.id, null);
  });

  return div;
}

function renderPlayingQueue(queueData) {
  const playlistDiv = document.getElementById("playlist");
  playlistDiv.innerHTML = "";

  if (!queueData || !queueData.queue) return;

  const currentId = queueData.currentSong ? String(queueData.currentSong.id) : null;

  for (const song of queueData.queue) {
    const item = document.createElement("div");
    item.className = "playlist-item";
    item.dataset.id = song.id; // Add data-id
    item.title = `${song.title}`;

    // Highlight current playing song
    if (currentId && String(song.id) === currentId) {
      item.classList.add("current");
    }

    item.innerHTML = `
      <img src="${song.cover || "images/albumph.png"}" alt="">
      <div class="song-info">
        <div class="song-name">${song.title}</div>
        <div class="artist-name">${song.artist || "Unknown Artist"}</div>
      </div>
      <div class="duration">${formatDuration(song.duration)}</div>
    `;

    // 🎵 Allow double-click to play this song in the queue
    item.addEventListener("dblclick", async () => {
      await playCommand(song.id, null); // play from existing queue
    });
    
    playlistDiv.appendChild(item);
  }
}

// OPEN FOLDER SONG LIST

let currentFolderSongs = [];
let currentFolderSongsSort = "added_asc";


function sortFolderSongs(sortKey) {
  currentFolderSongsSort = sortKey;

  currentFolderSongs.sort((a, b) => {
    switch (sortKey) {
      case "added_desc":
        return new Date(b.addedDate) - new Date(a.addedDate);
      case "added_asc":
        return new Date(a.addedDate) - new Date(b.addedDate);
      case "plays_desc":
        return (b.playCounter || 0) - (a.playCounter || 0);
      case "plays_asc":
        return (a.playCounter || 0) - (b.playCounter || 0);
      case "title_asc":
        return (a.title || "").localeCompare(b.title || "");
      case "title_desc":
        return (b.title || "").localeCompare(a.title || "");
      case "artist_asc":
        return (a.artist || "").localeCompare(b.artist || "");
      case "artist_desc":
        return (b.artist || "").localeCompare(a.artist || "");
      case "albumName_asc":
        return (a.albumName || "").localeCompare(b.albumName || "");
      case "albumName_desc":
        return (b.albumName || "").localeCompare(a.albumName || "");
      default:
        return 0;
    }
  });

  const list = document.getElementById("folderSongsList");
  renderSongsList(list, currentFolderSongs);
}

const sortBtnFolderSongs =
  document.getElementById("sortBtnFolderSongs");
const sortDropdownFolderSongs =
  document.getElementById("sortDropdownFolderSongs");

sortBtnFolderSongs.addEventListener("click", () => {
  sortDropdownFolderSongs.style.display =
    sortDropdownFolderSongs.style.display === "block"
      ? "none"
      : "block";
});

document
  .querySelectorAll("#sortDropdownFolderSongs .sortOption")
  .forEach(option => {
    option.addEventListener("click", async () => {
      const sortKey = option.dataset.sort;

      setActiveSortOptionFolderSongs(sortKey);
      await window.electronAPI.setFolderSongsSort(sortKey);

      sortFolderSongs(sortKey);
      sortDropdownFolderSongs.style.display = "none";
    });
  });

// Hide when clicking outside
document.addEventListener("click", e => {
  if (
    !sortBtnFolderSongs.contains(e.target) &&
    !sortDropdownFolderSongs.contains(e.target)
  ) {
    sortDropdownFolderSongs.style.display = "none";
  }
});


function setActiveSortOptionFolderSongs(sortKey) {
  document
    .querySelectorAll("#sortDropdownFolderSongs .sortOption")
    .forEach(o => o.classList.remove("active"));

  const opt = document.querySelector(
    `#sortDropdownFolderSongs .sortOption[data-sort="${sortKey}"]`
  );

  if (opt) opt.classList.add("active");
}

async function showFolderSongs(title, songs, path) {
  currentSongList = songs;            // playback
  currentFolderSongs = [...songs];    // working list

  const savedSort =
    (await window.electronAPI.getFolderSongsSort()) || "added_asc";

  setActiveSortOptionFolderSongs(savedSort);
  sortFolderSongs(savedSort);

  const visibleDiv = document.querySelector(
    '.middleContentItems:not([style*="display: none"])'
  );
  if (visibleDiv) lastVisiblePage = visibleDiv.id;

  document
    .querySelectorAll('.middleContentItems')
    .forEach(div => div.style.display = "none");

  const div = document.getElementById("folderSongsDiv");
  document.getElementById("folderSongsTitle").textContent = title;

  div.dataset.path = path;
  div.style.display = "block";
}


document.getElementById("openFolderBtn").addEventListener("click", async () => {
    const div = document.getElementById("folderSongsDiv");
    const folderPath = div.dataset.path;
    if (!folderPath) return;
    // Ask backend to open folder in system file explorer
    await window.electronAPI.openFolder(folderPath);
});

// CUSTOM PLAYLISTS

let currentPlaylistSongs = [];
let currentPlaylistSongsSort = "added_asc";

function sortPlaylistSongs(sortKey) {
  currentPlaylistSongsSort = sortKey;

  currentPlaylistSongs.sort((a, b) => {
    switch (sortKey) {
      case "added_desc":
        return new Date(b.addedDate) - new Date(a.addedDate);
      case "added_asc":
        return new Date(a.addedDate) - new Date(b.addedDate);
      case "plays_desc":
        return (b.playCounter || 0) - (a.playCounter || 0);
      case "plays_asc":
        return (a.playCounter || 0) - (b.playCounter || 0);
      case "title_asc":
        return (a.title || "").localeCompare(b.title || "");
      case "title_desc":
        return (b.title || "").localeCompare(a.title || "");
      case "artist_asc":
        return (a.artist || "").localeCompare(b.artist || "");
      case "artist_desc":
        return (b.artist || "").localeCompare(a.artist || "");
      case "albumName_asc":
        return (a.albumName || "").localeCompare(b.albumName || "");
      case "albumName_desc":
        return (b.albumName || "").localeCompare(a.albumName || "");
      default:
        return 0;
    }
  });

  const list = document.getElementById("playlistSongsList");
  renderSongsList(list, currentPlaylistSongs);
}


const sortBtnPlaylistSongs = document.getElementById("sortBtnPlaylistSongs");
const sortDropdownPlaylistSongs = document.getElementById("sortDropdownPlaylistSongs");

sortBtnPlaylistSongs.addEventListener("click", () => {
  sortDropdownPlaylistSongs.style.display =
    sortDropdownPlaylistSongs.style.display === "block"
      ? "none"
      : "block";
});

document.querySelectorAll("#sortDropdownPlaylistSongs .sortOption").forEach(option => {
    option.addEventListener("click", async () => {
      const sortKey = option.dataset.sort;

      setActiveSortOptionPlaylistSongs(sortKey);
      await window.electronAPI.setPlaylistSongsSort(sortKey);

      sortPlaylistSongs(sortKey);
      sortDropdownPlaylistSongs.style.display = "none";
    });
  });

// Hide when clicking outside
document.addEventListener("click", e => {
  if (
    !sortBtnPlaylistSongs.contains(e.target) &&
    !sortDropdownPlaylistSongs.contains(e.target)
  ) {
    sortDropdownPlaylistSongs.style.display = "none";
  }
});

function setActiveSortOptionPlaylistSongs(sortKey) {
  document.querySelectorAll("#sortDropdownPlaylistSongs .sortOption").forEach(o => o.classList.remove("active"));

  const opt = document.querySelector(
    `#sortDropdownPlaylistSongs .sortOption[data-sort="${sortKey}"]`
  );

  if (opt) opt.classList.add("active");
}

async function showPlaylistSongs(title, songs) {
  currentSongList = songs;              // playback queue
  currentPlaylistSongs = [...songs];    // working copy

  const savedSort = (await window.electronAPI.getPlaylistSongsSort()) || "added_asc";

  setActiveSortOptionPlaylistSongs(savedSort);
  sortPlaylistSongs(savedSort);

  const visibleDiv = document.querySelector('.middleContentItems:not([style*="display: none"])');
  if (visibleDiv) lastVisiblePage = visibleDiv.id;

  document.querySelectorAll('.middleContentItems').forEach(div => div.style.display = "none");

  document.getElementById("playlistSongsTitle").textContent = title;
  document.getElementById("playlistSongsDiv").style.display = "block";
}


async function openPlaylist(playlistId) {
  let isFixedPlaylist = false;

  if (playlistId === "favorites") {
    const songs = await window.electronAPI.getFavoriteSongs();
    currentOpenedPlaylist.id = "favorites";
    currentOpenedPlaylist.name = "Favorite Songs";
    showPlaylistSongs("Favorite Songs", songs);
    isFixedPlaylist = true;
  }
  else if (playlistId === "history") {
    const songs = await window.electronAPI.getHistorySongs();

    currentOpenedPlaylist.id = "history";
    currentOpenedPlaylist.name = "History";

    showPlaylistSongs("History", songs);
    isFixedPlaylist = true;
  }
  else {
    const pl = await window.electronAPI.getPlaylistInfo(playlistId);
    const songs = await window.electronAPI.getSongsByPlaylist(playlistId);

    currentOpenedPlaylist.id = playlistId;
    currentOpenedPlaylist.name = pl.name;
    showPlaylistSongs(pl.name, songs);
  }

  if (editBtn && deleteBtn) {
    if (isFixedPlaylist) {
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
    } else {
        editBtn.style.display = 'flex';
        deleteBtn.style.display = 'flex';
    }
  }
}

async function loadAndResizeImageToBase64(filePath, size = 120) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, size, size);

      const base64 = canvas.toDataURL("image/png");
      resolve(base64);
    };

    img.onerror = reject;

    img.src = "file:///" + filePath.replace(/\\/g, "/");
  });
}

document.getElementById("backToPlaylistsBtn").addEventListener("click", () => {
  document.getElementById("playlistSongsDiv").style.display = "none";

  if (lastVisiblePage) {
    document.getElementById(lastVisiblePage).style.display = "block";
  } else {
    document.getElementById("playlistsContent").style.display = "block";
  }

  lastVisiblePage = null;
});


//DRAG WINDOW SYSTEM------------------------------------

const draggableIds = ['dragVidInfo','dragId3','dragChange','dragInputPL','dragConfirm','dragAddToPlaylist', 'dragHandleAbout', 'dragEqualizer'];
let draggableElements = [];

draggableIds.forEach((id) => {
    const dragHandle = document.getElementById(id);
    const form = dragHandle.parentElement;
    draggableElements.push({ dragHandle, form });
});

draggableElements.forEach((draggable) => {
    let isDraggingWin = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    draggable.dragHandle.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', dragForm);
    document.addEventListener('mouseup', stopDrag);
    function startDrag(e) {
        isDraggingWin = true;
        dragOffsetX = e.pageX - draggable.form.offsetLeft;
        dragOffsetY = e.pageY - draggable.form.offsetTop;
    }
    function dragForm(e) {
        if (isDraggingWin) {
            draggable.form.style.left = e.pageX - dragOffsetX + 'px';
            draggable.form.style.top = e.pageY - dragOffsetY + 'px';
        }
    }
    function stopDrag() {
        isDraggingWin = false;
    }
});

// INPUT WINDOW / CONFIRM WINDOW

function confirmDlg(message, opts = {}) {
  return new Promise((resolve) => {
    const dlg = document.getElementById('confirmDlg');
    const text = document.getElementById('confirmText');
    const ok = document.getElementById('confirmOk');
    const cancel = document.getElementById('confirmCancel');
    const closeBtn = document.getElementById('confirmDlgCloseBtn');
    const title = document.getElementById('confirmDlg_Title');

    if (!dlg || !text || !ok || !cancel || !closeBtn || !title) {
      console.error('confirmDlg: missing dialog elements');
      return resolve(false);
    }

    title.innerText = 'Confirmation';
    cancel.classList.remove('hidden');

    // set message — either HTML or plain text
    if (opts.html) {
      text.innerHTML = message;
    } 
    else {
      text.textContent = message;
    }

    dlg.style.display = 'block';

    // focus OK for accessibility
    setTimeout(() => ok.focus(), 0);

    const cleanup = (result) => {
      // hide dialog
      dlg.style.display = 'none';

      // remove handlers
      ok.onclick = null;
      cancel.onclick = null;
      closeBtn.onclick = null;
      document.removeEventListener('keydown', escHandler);

      resolve(result);
    };

    ok.onclick = () => cleanup(true);
    cancel.onclick = () => cleanup(false);
    closeBtn.onclick = () => cleanup(false);

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        cleanup(false);
      }
    };

    document.addEventListener('keydown', escHandler);
  });
}

function alertDlg(message) {
  return new Promise((resolve) => {
    const dlg = document.getElementById('confirmDlg');
    const text = document.getElementById('confirmText');
    const ok = document.getElementById('confirmOk');
    const cancel = document.getElementById('confirmCancel');
    const closeBtn = document.getElementById('confirmDlgCloseBtn');
    const title = document.getElementById('confirmDlg_Title');

    title.innerText = 'Alert';
    cancel.classList.add("hidden");
    text.textContent = message;
    dlg.style.display = 'block';
    //setTimeout(() => ok.focus(), 0);

    const cleanup = (result) => {
      dlg.style.display = 'none';
      ok.onclick = cancel.onclick = closeBtn.onclick = null;
      resolve(result);
    };

    ok.onclick = () => cleanup(true);
    cancel.onclick = () => cleanup(false);
    closeBtn.onclick = () => cleanup(false);

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        cleanup(false);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  });
}

//alertDlg(`Are you sure you want to delete selected files? They will be moved to trash.`);
//confirmDlg(`Are you sure you want to delete selected files? They will be moved to trash.`);

// NEW PLAYLIST

document.getElementById("addPlaylistBtn").addEventListener("click", () => {
  dlgInputPL.value = "";
  dlgImgPL.src = "images/albumph.png";
  dlgPL.style.display = "block";
});

const dlgPL = document.getElementById("inputDlgPL");
const dlgInputPL = document.getElementById("inputDlgInputPL");
const dlgImgPL = document.getElementById("inputAlbumImgPL");

document.getElementById("inputImgSelectBtnPL").addEventListener("click", async () => {
  const result = await window.electronAPI.openFile({
    title: "Select Playlist Image",
    filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg"] }],
    properties: ["openFile"]
  });

  if (result.canceled) return;

  const filePath = result.filePaths[0];

  // Resize to base64 120x120
  const base64 = await loadAndResizeImageToBase64(filePath);

  dlgImgPL.src = base64;
  dlgImgPL.dataset.base64 = base64;
});

function stripFileProtocol(path) {
  if (!path) return path;
  // Remove file:// or file:/// prefix
  path = path.replace(/^file:\/+/, "");
  // Convert all / to \ (Windows)
  return path.replace(/\//g, "\\");
}

document.getElementById("inputDlgOkPL").onclick = async () => {
  const name = dlgInputPL.value.trim();
  if (!name) return;

  // Must be first
  const imgBase64 = dlgImgPL.dataset.base64 || null;

  // Read save modes
  const modeQueueSave   = dlgPL.dataset.queueSaveMode === "1"; // Save Playing Queue
  const modeAAGSave     = dlgPL.dataset.queueSaveMode === "2"; // Save Artist/Album/Genre
  const songIDsForSave  = dlgPL._queueSongIDs || [];

  // Close dialog BEFORE processing
  dlgPL.style.display = "none";

  // Reset flags
  dlgPL.dataset.queueSaveMode = "";
  dlgPL._queueSongIDs = null;

  let result;
  let editedId = null;

  // ------------- EDIT PLAYLIST -------------
  if (dlgPL.dataset.editMode === "1") { 
    editedId = dlgPL.dataset.editPlaylistId; // <-- save before wiping

    result = await window.electronAPI.updatePlaylist(
        editedId,
        name,
        imgBase64
    );

    dlgPL.dataset.editMode = "";
    dlgPL.dataset.editPlaylistId = "";
  }

  // ------------- CREATE PLAYLIST -------------
  else if (!modeQueueSave && !modeAAGSave) {
    result = await window.electronAPI.createPlaylist(
        name,
        imgBase64
    );
  }

  // ------------- SAVE PLAYING QUEUE -------------
  else if (modeQueueSave) {
    result = await window.electronAPI.saveQueueAsPlaylistBackEnd(
        name,
        imgBase64,
        songIDsForSave
    );
  }

  // ------------- SAVE AAG SONG LIST (Artist / Album / Genre) -------------
  else if (modeAAGSave) {

      result = await window.electronAPI.saveQueueAsPlaylistBackEnd(
          name,
          imgBase64,
          songIDsForSave
      );
  }

  // 🔥 ALWAYS RESET IMAGE FOR NEXT USE
  dlgImgPL.dataset.base64 = "";
  dlgImgPL.src = "images/albumph.png";

  // Feedback
  if (result?.success) {
    if (editedId && currentOpenedPlaylist.id == editedId) {
      currentOpenedPlaylist.name = name;
      document.getElementById("playlistSongsTitle").textContent = name;
    }
    if (modeQueueSave) {
      showErrorMsg("info", "Queue saved as playlist.");
    }
    else if (modeAAGSave) {
      showErrorMsg("info", "Playlist created from selection.");
    }
    await loadPlaylists();
  }
  else {
    showErrorMsg("error", "Failed to save playlist.");
  }
};

document.getElementById("inputDlgCancelPL").addEventListener("click", () => {
  dlgPL.style.display = "none";
});

document.getElementById("inputDlgCloseBtnPL").addEventListener("click", () => {
  dlgPL.style.display = "none";
});

// PLAYLIST RIGHT-CLICK MENU

const playlistContextMenu = document.getElementById("playlistContextMenu");
const ctxPlaylistTitle = document.getElementById("ctxPlaylistTitle");
let selectedPlaylistId = null;
let selectedPlaylistName = "";

// Right-click on playlist item

// Hide on click elsewhere
document.addEventListener("click", () => {
  playlistContextMenu.style.display = "none";
});

playlistContextMenu.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("ctx-item")) return;
  if (!selectedPlaylistId) return;

  const action = e.target.dataset.action;

  switch (action) {

    case "play": {
      const songs = await window.electronAPI.getSongsByPlaylist(selectedPlaylistId);

      if (!songs || songs.length === 0) {
          showErrorMsg("error", "Playlist is empty.");
          break;
      }

      // Normalize songs so playbar receives album + cover fields
      const fullQueue = songs.map(s => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          album: s.albumName,   // FIXED
          year: s.year,
          cover: s.albumArt,    // FIXED
          filePath: s.filePath,
          duration: s.duration
      }));

      const queueData = {
          queue: fullQueue,
          currentIndex: 0,
          currentSong: fullQueue[0]
      };

      await window.electronAPI.setPlayingQueue(queueData);

      // Play first song
      await playCommand(fullQueue[0].id, null);

      // Refresh queue sidebar
      await loadPlayingQueue();

      showErrorMsg("info", "Playing playlist.");
      break;
    }

    case "shufflePlay":
      const psongs = await window.electronAPI.getSongsByPlaylist(selectedPlaylistId);

      if (!psongs || psongs.length === 0) {
          showErrorMsg("error", "Playlist is empty.");
          break;
      }

      // Shuffle the list
      const shuffled = [...psongs];
      for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const first = shuffled[0];

      // Build queueData in the same format as your existing function
      const queueData = {
          currentSong: {
              id: first.id,
              title: first.title,
              artist: first.artist,
              album: first.albumName,
              year: first.year,
              cover: first.albumArt,
              filePath: first.filePath,
              duration: first.duration
          },
          queue: shuffled.map(s => ({
              id: s.id,
              title: s.title,
              artist: s.artist,
              album: s.albumName,
              year: s.year,
              cover: s.albumArt,
              filePath: s.filePath,
              duration: s.duration
          })),
          currentIndex: 0
      };

      await window.electronAPI.setPlayingQueue(queueData);
      await playCommand(first.id, null);
      await loadPlayingQueue();

      showErrorMsg("info", "Shuffled & Playing.");
      
      break;

    case "addQueue": {
      addPlaylistToQueue(selectedPlaylistId)
      break;
    }

    case "editPL":
      editPL(selectedPlaylistId);
      break;

    case "exportPL":
      try {
          const songs = await window.electronAPI.getSongsByPlaylist(selectedPlaylistId);

          if (!songs || songs.length === 0) {
              showErrorMsg("error", "Playlist is empty.");
              break;
          }

          await window.electronAPI.exportPlaylistToM3U8({
              playlistId: selectedPlaylistId,
              songs
          });

          showErrorMsg("info", "Playlist exported.");
      }
      catch (err) {
          showErrorMsg("error", `Error exporting playlist: ${err.message}`);
      }
      break;

    case "delete":
        if (await confirmDlg(`Delete playlist <b>${selectedPlaylistName}</b>?<br><small>(Songs are not deleted)</small>`, { html: true })) {
            await deletePlaylist(selectedPlaylistId);
            await loadPlaylists();
        }
        break;
  }

  playlistContextMenu.style.display = "none";
});

async function addPlaylistToQueue(selectedPlaylistId) {
  const queueSongs = await window.electronAPI.getSongsByPlaylist(selectedPlaylistId);

  let addedCount = 0;
  let alreadyInQueueCount = 0;
  let failed = [];

  for (const s of queueSongs) {
    const result = await window.electronAPI.addToQueue(s.id);
    if (result?.success) {
        if (result.alreadyExists) {
          alreadyInQueueCount++;
        } 
        else {
          addedCount++;
        }
    } 
    else {
        failed.push(s.title || "Unknown Song");
    }
  }

  await loadPlayingQueue();

  if (addedCount > 0) showErrorMsg("info", `Added ${addedCount} song(s) to queue.`);
  if (alreadyInQueueCount > 0) showErrorMsg("info",`${alreadyInQueueCount} song(s) already in the queue.`);
  if (failed.length > 0) showErrorMsg("error", `Failed to add: ${failed.join(", ")}`);
}

async function editPL(id) {
    const result = await window.electronAPI.getPlaylistById(id);

    if (!result.success) {
        showErrorMsg("error", "Failed to load playlist.");
        return;
    }

    const pl = result.playlist;

    dlgPL.dataset.editMode = "1";
    dlgPL.dataset.editPlaylistId = id;

    // Dialog title + button
    document.querySelector(".inputDlgPL_Title").textContent = "Edit Playlist";
    document.getElementById("inputDlgOkPL").textContent = "Save";

    // Name
    dlgInputPL.value = pl.name;

    // Image
    if (pl.thumbnail) {
        dlgImgPL.src = pl.thumbnail;
        dlgImgPL.dataset.base64 = pl.thumbnail;
    } 
    else {
        dlgImgPL.src = "images/albumph.png";
        dlgImgPL.dataset.base64 = "";
    }

    // Mark edit mode
    dlgPL.dataset.editMode = "1";
    dlgPL.dataset.editId = id;

    dlgPL.dataset.queueSaveMode = "";
    dlgPL._queueSongIDs = null;

    dlgPL.style.display = "block";
}

document.getElementById("importPlaylistBtn").addEventListener("click", async () => {
  const result = await window.electronAPI.openM3U8File();
  if (!result || !result.filePath) return; // user cancelled
  const res = await window.electronAPI.importM3U8Playlist(result.filePath);
  if (!res.success) {
    showErrorMsg("error", res.error);
    loadPlaylists();
    return;
  }
  showErrorMsg("info", `Playlist imported (${res.imported} new songs).`);
  loadPlaylists();
});

shufflePlayBtnSongList.addEventListener("click", async () => {
  await shuffleAndPlay();
});
shuffleAndPlayBtnCategory.addEventListener("click", async () => {
  await shuffleAndPlay();
});
shuffleAndPlayBtnPlaylist.addEventListener("click", async () => {
  await shuffleAndPlay();
});
shuffleAndPlayBtnFolder.addEventListener("click", async () => {
  await shuffleAndPlay();
});

async function shuffleAndPlay() {
  if (!currentSongList || currentSongList.length === 0) return;

  // Copy list
  const shuffled = [...currentSongList];

  // Shuffle the list (Fisher-Yates)
  for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const firstSong = shuffled[0];

  const queueData = {
      currentSong: {
          id: firstSong.id,
          title: firstSong.title,
          artist: firstSong.artist,
          album: firstSong.albumName,
          year: firstSong.year,
          cover: firstSong.albumArt,
          filePath: firstSong.filePath,
          duration: firstSong.duration
      },
      queue: shuffled.map(s => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          album: s.albumName,
          year: s.year,
          cover: s.albumArt,
          filePath: s.filePath,
          duration: s.duration
      })),
      currentIndex: 0
  };

  // Save new queue
  await window.electronAPI.setPlayingQueue(queueData);

  // Play the first shuffled song
  await playCommand(firstSong.id, null);

  // Update the queue UI
  await loadPlayingQueue();
}

playAllBtnSongList.addEventListener("click", playAll);
playAllBtnCategory.addEventListener("click", playAll);
playAllBtnPlaylist.addEventListener("click", playAll);
playAllBtnFolder.addEventListener("click", playAll);

function normalizeSong(s) {
  return {
    id: s.id,
    title: s.title,
    artist: s.artist,
    album: s.albumName,  // convert
    year: s.year,
    cover: s.albumArt,   // convert
    filePath: s.filePath,
    duration: s.duration
  };
}

async function playAll() {
  if (!currentSongList || currentSongList.length === 0) return;

  const fullQueue = currentSongList.map(normalizeSong);

  const queueData = {
    queue: fullQueue,
    currentIndex: 0,
    currentSong: fullQueue[0]
  };

  await window.electronAPI.setPlayingQueue(queueData);
  await playCommand(fullQueue[0].id, null);
  await loadPlayingQueue();
}

// ----------------------- SEARCH SYSTEM ----------------------- 

// SEARCH INPUT

let searchTimeout = null;

const searchInput = document.getElementById('searchInput');
const searchField = document.querySelector('.search-field');
const clearBtn = document.querySelector('.clear-btn');

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchField.classList.remove('has-text');
  searchInput.focus();
  searchResults.innerHTML = "";
  loadInitialSearchPage();
});

const searchResults = document.getElementById("searchResults");
const tags = document.querySelectorAll(".theTags");

let activeTag = "all";  // default when opening search

// -------------------- TAG CLICK --------------------

tags.forEach(tag => {
    tag.addEventListener("click", () => {

        // remove previous selection
        tags.forEach(t => t.classList.remove("selected"));

        // set new selected
        tag.classList.add("selected");

        // get tag name
        activeTag = tag.innerText.trim().toLowerCase(); // all/songs/videos...

        runSearch();
    });
});

// -------------------- SEARCH INPUT --------------------

searchInput.addEventListener('input', () => {
  if (searchInput.value.trim() !== '') {

    // DISPLAY CLEAR BUTTON
    searchField.classList.add('has-text');

    // debounce search
    if (searchTimeout) clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        runSearch();
    }, 350);

  } 

  else {
    //RESET SEARCH PAGE
    searchResults.innerHTML = "";
    loadInitialSearchPage();
    // HIDE CLEAR BUTTON
    searchField.classList.remove('has-text');
  }
});

// -------------------- EXECUTE SEARCH --------------------

async function runSearch() {
    const text = searchInput.value.trim();

    if (text.length === 0) {
        loadInitialSearchPage();
        return;
    }

    const results = await window.electronAPI.search(text, activeTag);
    renderResults(results);
}

async function getSearchHistoryFunc() {
  const getSearchHistoryResult = await window.electronAPI.getSearchHistory();
  //console.log(getSearchHistoryResult[0].term)
}
//getSearchHistoryFunc();
async function loadInitialSearchPage() {
  const history = await window.electronAPI.getSearchHistory();

  searchResults.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "searchHistoryContainer";

  const grid = document.createElement("div");
  grid.className = "searchHistoryGrid";

  if (history.length === 0) {
      wrapper.innerHTML = `<div class="noHistory">No search history yet</div>`;
      searchResults.appendChild(wrapper);
      return;
  }

  // History items
  history.forEach(row => {
    const item = document.createElement("div");
    item.className = "historyItem";

    item.innerHTML = `
        <svg class="historyIcon" viewBox="0 -960 960 960">
            <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56Z"/>
        </svg>
        <span>${row.term}</span>
    `;

    item.addEventListener("click", () => {
        searchInput.value = row.term;
        searchField.classList.add('has-text');
        runSearch();
    });

    grid.appendChild(item);
  });

  wrapper.appendChild(grid);

  // ---- CLEAR HISTORY BUTTON ----
  const clearBtn = document.createElement("div");
  clearBtn.className = "clearSearchHistoryBtn";
  clearBtn.textContent = "Clear search history";

  clearBtn.addEventListener("click", async () => {
      await window.electronAPI.clearSearchHistory();
      loadInitialSearchPage(); // reload UI
  });

  wrapper.appendChild(clearBtn);
  searchResults.appendChild(wrapper);
}

loadInitialSearchPage();

function renderResults(data) {
    searchResults.innerHTML = "";

    if (!data) {
        searchResults.innerHTML = `<div class="noResults">No results</div>`;
        return;
    }

    let hasAny = false;

    if (data.songs?.length) { renderSongs(data.songs); hasAny = true; }
    if (data.videos?.length) { renderVideos(data.videos); hasAny = true; }
    if (data.playlists?.length) { renderPlaylists(data.playlists); hasAny = true; }
    if (data.albums?.length) { renderAlbums(data.albums); hasAny = true; }
    if (data.artists?.length) { renderArtists(data.artists); hasAny = true; }
    if (data.genres?.length) { renderGenres(data.genres); hasAny = true; }

    if (!hasAny) {
        searchResults.innerHTML = `<div class="noResults">No results</div>`;
    }
}

function renderSongs(list) {
  const number = list.length;
  const title = createSection(`${number} Songs`);
  const container = document.createElement("div");
  container.className = "searchSongsList";

  const favFilledSvg = `<svg class="heart" viewBox="0 -960 960 960"><path d="M480-142.33q-12 0-24.17-4.34Q443.67-151 434.67-160l-58.34-53.67q-118-109-207.16-210.5Q80-525.67 80-640q0-91.33 61.33-152.67 61.34-61.33 152-61.33Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.33Q880-731.33 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9 9-21.16 13.33-12.17 4.34-24.17 4.34Z"/></svg>`;

  const favEmptySvg = `<svg class="heart" viewBox="0 -960 960 960"><path d="M480-142.33q-11.8 0-24.02-4.25-12.22-4.25-21.49-13.59l-58.16-53.5q-118-109-207.16-210.5Q80-525.67 80-640q0-91.44 61.33-152.72 61.34-61.28 152-61.28Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.28Q880-731.44 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9.16 9.25-21.25 13.46-12.08 4.21-24.08 4.21Zm-30-543q-27.67-46.34-68-74.17t-88.67-27.83q-64 0-105.33 41.66-41.33 41.67-41.33 105.96 0 55.71 38.25 117.65 38.25 61.93 91.5 120.16T386.5-293.33q56.83 50.33 93.5 84 36.67-33 93.5-83.67t110-109.33Q736.67-461 775-522.96q38.33-61.96 38.33-117.04 0-64-41.66-105.67-41.67-41.66-105-41.66-49 0-89 27.5t-69 74.5q-5.67 8.66-13 12.66-7.34 4-16.34 4t-16.66-4q-7.67-4-12.67-12.66Zm30 187Z"/></svg>`;

  list.forEach(song => {
      const isFav = !!song.isFavorite;
      const favStatus = isFav ? 'fav' : '';
      const favIcon = isFav ? favFilledSvg : favEmptySvg;

      const duration = formatDuration(song.duration);

      const item = document.createElement('div');
      item.className = 'songsRow';
      item.dataset.id = song.id;
      item.innerHTML = `
        <div class="songArtCol">
          <div class="albumArtWrapper">
            <img src="${song.albumArt || 'images/albumph.png'}">
            <div class="playOverlay" data-id="${song.id}">▶</div>
          </div>
        </div>
        <div class="songNameCol">${song.title}</div>
        <div class="songArtistCol">${song.artist || 'Unknown Artist'}</div>
        <div class="songAlbumCol">${song.albumName || 'Unknown Album'}</div>
        <div class="songYearCol">${song.year || ''}</div>
        <div class="songFavCol ${favStatus}">${favIcon}</div>
        <div class="songDurationCol">${duration}</div>
      `;

      // Double click to play
      item.ondblclick = async (e) => {
        // if dblclick happens on heart, ignore
        if (e.target.closest('.songFavCol')) return;
        await playCommand(song.id);
      };

      // Play overlay click
      item.querySelector('.playOverlay').addEventListener('click', async (e) => {
        e.stopPropagation();
        await playCommand(song.id);
      });

      // --- Favorite click handler (fixed) ---
      const favEl = item.querySelector('.songFavCol');
      favEl.addEventListener('click', async (e) => {
        e.stopPropagation();

        const isCurrentlyFav = favEl.classList.contains('fav');
        const newFav = !isCurrentlyFav;

        // Optimistically update UI, but revert if IPC fails
        favEl.classList.toggle('fav', newFav);
        favEl.innerHTML = newFav ? favFilledSvg : favEmptySvg;

        try {
          // setSongFavorite expects 1 or 0 (match your other code)
          //await window.electronAPI.setSongFavorite(song.id, newFav ? 1 : 0);
          const result = await window.electronAPI.setSongFavorite(song.id, newFav ? 1 : 0);
          if (result?.success) {
            const title = result.row.title;
            if (newFav) {
              showErrorMsg("info", `Added to Favorites: ${title}`);
            } 
            else {
              showErrorMsg("info", `Removed from Favorites: ${title}`);
            }
          }
          // persist in-memory state so subsequent toggles are correct
          song.isFavorite = newFav;
        } catch (err) {
          console.error('[setSongFavorite] failed', err);
          // revert UI on failure
          favEl.classList.toggle('fav', !newFav);
          favEl.innerHTML = !newFav ? favFilledSvg : favEmptySvg;
        }
      });

      container.appendChild(item);
  });

  searchResults.appendChild(title);
  searchResults.appendChild(container);
}

function renderVideos(list) {
  const number = list.length;
  const title = createSection(`${number} Videos`);
  const grid = document.createElement("div");
  grid.className = "searchVideoGrid"; // you can keep or switch to videoGrid

  list.forEach(video => {
    const item = document.createElement("div");
    item.className = "videoGridItem";   // same class as normal grid

    item.innerHTML = `
      <div class="videoGridThumbWrapper">
        <img class="videoGridThumb" src="${video.thumbnail || 'images/albumph.png'}">
        <div class="videoGridDuration">${formatDuration(video.duration)}</div>
      </div>
      <div class="videoGridName">${video.title}</div>
    `;

    item.addEventListener("dblclick", () => playVideo(video.id));

    grid.appendChild(item);
  });

  searchResults.appendChild(title);
  searchResults.appendChild(grid);
}

function renderPlaylists(list) {
  const number = list.length;
  const title = createSection(`${number} Playlists`);

  const grid = document.createElement("div");
  grid.className = "searchGrid";

  list.forEach(pl => {
    const div = document.createElement("div");
    div.className = "playlistItem";   // same style as other pages
    div.dataset.id = pl.id;

    div.innerHTML = `
      <img class="playlistImage" src="${pl.thumbnail || 'images/albumph.png'}">
      <div class="playlistName">${pl.name}</div>
      <div class="playlistCount">${pl.count} ${pl.count === 1 ? 'song' : 'songs'}</div>
    `;

    div.onclick = () => openPlaylist(pl.id);

    grid.appendChild(div);
  });

  searchResults.appendChild(title);
  searchResults.appendChild(grid);
}

function renderAlbums(list) {
    const number = list.length;
    const title = createSection(`${number} Albums`);
    const grid = document.createElement("div");
    grid.className = "searchGrid";

    list.forEach(a => {
        const cover = a.albumArt?.trim() ? a.albumArt : "images/discph.png";

        const item = document.createElement("div");
        item.className = "mediaGridItem";

        // 🔥 Required for context menu
        item.dataset.type = "album";
        item.dataset.id = a.id;
        item.dataset.name = a.name;

        item.innerHTML = `
            <img class="mediaGridImage" src="${cover}">
            <div class="mediaGridName">${a.name}</div>
            <div class="mediaGridSub">${a.artist || "Unknown Artist"}</div>
        `;

        item.onclick = () => openAlbumSongs(a.id);

        grid.appendChild(item);
    });

    searchResults.appendChild(title);
    searchResults.appendChild(grid);
}

function renderArtists(list) {
  const number = list.length;
  const title = createSection(`${number} Artists`);
  const grid = document.createElement("div");
  grid.className = "searchGrid";

  list.forEach(a => {
    const arts = a.albumArts || [];

    const item = document.createElement("div");
    item.className = "artistItem";

    // 🔥 Required
    item.dataset.type = "artist";
    item.dataset.id = a.id;
    item.dataset.name = a.name;

    let artHTML = "";
    if (arts.length >= 4) {
      artHTML = `
        <div class="artistCollage four">
          <img src="${arts[0]}">
          <img src="${arts[1]}">
          <img src="${arts[2]}">
          <img src="${arts[3]}">
        </div>`;
    } 
    else if (arts.length === 3) {
      artHTML = `
        <div class="artistCollage three">
          <div class="top">
            <img src="${arts[0]}">
            <img src="${arts[1]}">
          </div>
          <div class="bottom">
            <img src="${arts[2]}">
          </div>
        </div>`;
    } 
    else if (arts.length === 2) {
      artHTML = `
        <div class="artistCollage two">
          <img src="${arts[0]}">
          <img src="${arts[1]}">
        </div>`;
    } 
    else if (arts.length === 1) {
      artHTML = `
        <div class="artistCollage one">
          <img src="${arts[0]}">
        </div>`;
    } 
    else {
      artHTML = `
        <div class="artistCollage placeholder">
          <img src="images/artistph.png">
        </div>`;
    }

    item.innerHTML = `
      ${artHTML}
      <div class="playlistName">${a.name}</div>
    `;

    item.onclick = () => openArtistSongs(a.id);

    grid.appendChild(item);
  });

  searchResults.appendChild(title);
  searchResults.appendChild(grid);
}
function renderGenres(list) {
  const number = list.length;
  const title = createSection(`${number} Genre${number === 1 ? "" : "s"}`);
  searchResults.appendChild(title);

  const container = document.createElement("div");
  container.className = "searchGenresContainer";
  searchResults.appendChild(container);

  list.forEach(g => {
    const item = document.createElement("div");
    item.className = "genreItem";

    // 🔥 Required for context menu
    item.dataset.type = "genre";
    item.dataset.id = g.id;
    item.dataset.name = g.name;

    const img = document.createElement("img");
    img.className = "genreImage";
    img.src = g.albumArts?.[0] || "images/genreph.png";

    const infoDiv = document.createElement("div");
    infoDiv.className = "genreInfo";

    const nameDiv = document.createElement("div");
    nameDiv.className = "genreName";
    nameDiv.textContent = g.name;

    const countDiv = document.createElement("div");
    countDiv.className = "genreCount";
    countDiv.textContent = `${g.songCount || 0} Song${g.songCount === 1 ? "" : "s"}`;

    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(countDiv);

    item.appendChild(img);
    item.appendChild(infoDiv);

    item.addEventListener("click", () => openGenreSongs(g.id));

    container.appendChild(item);
  });
}

searchResults.addEventListener("contextmenu", (e) => {
    const item = e.target.closest("[data-type]");
    if (!item) return;

    e.preventDefault();

    mediaCtxTarget = {
      id: item.dataset.id,
      name: item.dataset.name,
      type: item.dataset.type
    };

    mediaCtxType = item.dataset.type;

    const menu = document.getElementById("mediaContextMenu");

    // SET TITLE
    const titleEl = menu.querySelector(".ctx-title");
    if (titleEl)
        titleEl.textContent = item.dataset.name || "";

    menu.style.display = "block";
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
});

function createSection(name) {
    const title = document.createElement("div");
    title.className = "searchSectionTitle";
    title.textContent = name;
    return title;
}

// PLAYING QUEUE CONTEXT MENU

const playListMenu = document.getElementById("playListMenu");
const playingQueueContextMenu = document.getElementById("playingQueueContextMenu");

// Toggle menu on click
playListMenu.addEventListener("click", (e) => {
    e.stopPropagation();
    playingQueueContextMenu.style.display =
        playingQueueContextMenu.style.display === "block" ? "none" : "block";
});

// Close on outside click
document.addEventListener("click", () => {
    playingQueueContextMenu.style.display = "none";
});

// Handle menu actions
playingQueueContextMenu.addEventListener("click", async (e) => {
    const item = e.target.closest(".playlistMenuItem");
    if (!item) return;

    const action = item.dataset.action;

    switch (action) {
      case "clear":
          const clear = await window.electronAPI.clearPlayingQueue();
          if (clear.success) {
              showErrorMsg("info", "Queue cleared.");
              await loadPlayingQueue();
          }
          else {
            showErrorMsg("error", "Error cleaning Queue.");
          }
          break

      case "save":
          await saveQueueAsPlaylist();
          break;

      case "add-to":
          await openAddQueueToPlaylistDialog();
          break;

      case "export":
          await funcExportQueueToM3U8();
          break;
    }

    playingQueueContextMenu.style.display = "none";
});

async function funcExportQueueToM3U8() {
  try {
    await window.electronAPI.exportQueueToM3U8();
    showErrorMsg("info", "Queue exported as Playlist File.");
  } 
  catch (err) {
    showErrorMsg("error", `Error exporting playlist: ${err.message}`);
  }
};

async function exportQueueToM3U8(queue) {
    if (!queue.length) return showErrorMsg("error", "Queue is empty.");

    const paths = queue.map(s => s.filePath).join("\n");

    const filePath = await window.electronAPI.saveDialog("playlist.m3u8");
    if (!filePath) return;

    await window.electronAPI.writeFile(filePath, paths);
    showErrorMsg("info", "Playlist exported.");
}

async function saveQueueAsPlaylist() {
    const q = await window.electronAPI.getPlayingQueue();

    if (!q || !Array.isArray(q.queue) || q.queue.length === 0) {
        return showErrorMsg("error", "Queue is empty.");
    }

    // OPEN your existing New Playlist dialog
    dlgInputPL.value = "";
    dlgImgPL.src = "images/albumph.png";
    dlgImgPL.dataset.base64 = "";
    
    dlgPL.style.display = "block";

    // TEMPORARY callback for OK click
    dlgPL.dataset.queueSaveMode = "1";
    
    dlgPL._queueSongIDs = q.queue.map(s => s.id);
}

async function deletePlaylist(playlistID) {
  const result = await window.electronAPI.deletePlaylist(playlistID);

  if (result.success) {
    showErrorMsg("info", "Playlist deleted.");
    await loadPlaylists();
  } 
  else {
    showErrorMsg("error", "Failed to delete playlist.");
  }
}

let addToPlaylist_Selected = new Set();

async function openAddQueueToPlaylistDialog(songIDs) {
  addToPlaylist_Selected.clear();

  const list = document.getElementById("addQueueToPlaylist_List");

  addQueueToPlaylistDlg.style.display = "flex"; // use flex for centering
  list.innerHTML = "";

  const playlists = await window.electronAPI.getAllPlaylists();

  playlists.forEach(pl => {
    const div = document.createElement("div");
    div.className = "playlistItem addToPlaylistItem";
    div.dataset.id = pl.id;

    div.innerHTML = `
      <img class="playlistImage" src="${pl.thumbnail || "images/albumph.png"}">
      <div class="playlistName">${pl.name}</div>
      <div class="playlistCount">${pl.count} ${pl.count === 1 ? "song" : "songs"}</div>
    `;

    div.addEventListener("click", () => {
      const id = pl.id;

      if (addToPlaylist_Selected.has(id)) {
        addToPlaylist_Selected.delete(id);
        div.classList.remove("selected");
      } 
      else {
        addToPlaylist_Selected.add(id);
        div.classList.add("selected");
      }
    });

    list.appendChild(div);
  });
}
const addQueueToPlaylistDlg = document.getElementById('addQueueToPlaylistDlg');
const addToPlaylistDlgCloseBtn = document.getElementById('addToPlaylistDlgCloseBtn');
const addQueueToPlaylist_CancelBtn = document.getElementById('addQueueToPlaylist_CancelBtn');
const addQueueToPlaylist_AddBtn = document.getElementById('addQueueToPlaylist_AddBtn');

addToPlaylistDlgCloseBtn.onclick = () => {
  addQueueToPlaylistDlg.style.display = "none";
};

addQueueToPlaylist_CancelBtn.onclick = () => {
  addQueueToPlaylistDlg.style.display = "none";
};

addQueueToPlaylist_AddBtn.onclick = async () => {

  if (addToPlaylist_Selected.size === 0) {
    showErrorMsg("error", "Select at least one playlist.");
    return;
  }

  let songIDs = [];

  // 1) Artist / Album / Genre mode (AAG)
  if (addQueueToPlaylistDlg._AAGSongIDs && 
      Array.isArray(addQueueToPlaylistDlg._AAGSongIDs)) {

    songIDs = [...addQueueToPlaylistDlg._AAGSongIDs];
  }

  // 2) Normal Queue mode
  else {
    const queueObj = await window.electronAPI.getPlayingQueue();
    if (!queueObj || !Array.isArray(queueObj.queue)) {
      showErrorMsg("error", "No songs to add.");
      addQueueToPlaylistDlg.style.display = "none";
      return;
    }

    songIDs = queueObj.queue.map(s => s.id);
  }

  if (songIDs.length === 0) {
    showErrorMsg("error", "No songs to add.");
    addQueueToPlaylistDlg.style.display = "none";
    return;
  }

  // Add to selected playlists
  for (const playlistID of addToPlaylist_Selected) {
    await window.electronAPI.addSongsToPlaylist(playlistID, songIDs);
  }

  showErrorMsg("info", "Songs added to selected playlists.");
  addQueueToPlaylistDlg.style.display = "none";

  // Reset AAG temp storage
  addQueueToPlaylistDlg._AAGSongIDs = null;
};

//DELETE PLAYLIST BTN
const deletePlaylistBtn = document.getElementById('deletePlaylistBtn');

deletePlaylistBtn.onclick = async () => {
  if (!currentOpenedPlaylist.id) {
    showErrorMsg("error", "No playlist is currently opened.");
    return;
  }
  if (await confirmDlg(`Delete playlist <b>${currentOpenedPlaylist.name}</b>?<br><small>(Songs are not deleted)</small>`, { html: true })) {
    await deletePlaylist(currentOpenedPlaylist.id);
    // Optionally go back to playlist list view, e.g.:
    playlistsSideBtn.click();
    await loadPlaylists();
  }
};

editPlaylistBtn.addEventListener('click', () => {
  if (!currentOpenedPlaylist.id) {
    showErrorMsg("error", "No playlist is currently opened.");
    return;
  }
  editPL(currentOpenedPlaylist.id);
});

addToQueueBtn.addEventListener('click', () => {
  if (!currentOpenedPlaylist.id) {
    showErrorMsg("error", "No playlist is currently opened.");
    return;
  }
  addPlaylistToQueue(currentOpenedPlaylist.id)
});

// --------------------------HOME PAGE ITEMS-----------------------------------

function renderSongList(containerId, songs) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const favFilledSvg = `<svg class="heart" viewBox="0 -960 960 960"><path d="M480-142.33q-12 0-24.17-4.34Q443.67-151 434.67-160l-58.34-53.67q-118-109-207.16-210.5Q80-525.67 80-640q0-91.33 61.33-152.67 61.34-61.33 152-61.33Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.33Q880-731.33 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9 9-21.16 13.33-12.17 4.34-24.17 4.34Z"/></svg>`;
  const favEmptySvg = `<svg class="heart" viewBox="0 -960 960 960"><path d="M480-142.33q-11.8 0-24.02-4.25-12.22-4.25-21.49-13.59l-58.16-53.5q-118-109-207.16-210.5Q80-525.67 80-640q0-91.44 61.33-152.72 61.34-61.28 152-61.28Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.28Q880-731.44 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9.16 9.25-21.25 13.46-12.08 4.21-24.08 4.21Zm-30-543q-27.67-46.34-68-74.17t-88.67-27.83q-64 0-105.33 41.66-41.33 41.67-41.33 105.96 0 55.71 38.25 117.65 38.25 61.93 91.5 120.16T386.5-293.33q56.83 50.33 93.5 84 36.67-33 93.5-83.67t110-109.33Q736.67-461 775-522.96q38.33-61.96 38.33-117.04 0-64-41.66-105.67-41.67-41.66-105-41.66-49 0-89 27.5t-69 74.5q-5.67 8.66-13 12.66-7.34 4-16.34 4t-16.66-4q-7.67-4-12.67-12.66Zm30 187Z"/></svg>`;

  for (const song of songs) {
    const albumArtPath = song.albumArt && song.albumArt.trim() !== ''
      ? song.albumArt
      : 'images/albumph.png';

    const isFav = !!song.isFavorite;
    const favStatus = isFav ? 'fav' : '';

    const card = document.createElement('div');
    card.className = 'songCard';
    card.dataset.id = song.id;
    card.innerHTML = `
      <div class="songCardLeft">
        <div class="songCardImageWrapper">
          <img class="songCardImage" src="${albumArtPath}" alt="">
          <div class="songCardPlay">▶</div>
        </div>
        <div class="songCardInfo">
          <div class="songCardTitle">${song.title}</div>
          <div class="songCardArtist">${song.artist || "Unknown Artist"}</div>
        </div>
      </div>

      <div class="songCardHeart" data-id="${song.id}">
        <div class="songFavCol ${favStatus}">${isFav ? favFilledSvg : favEmptySvg}</div>
      </div>
    `;

    // Play on click (not on heart)
    card.querySelector('.songCardLeft').addEventListener('click', async () => {
      await playCommand(song.id, currentSongList);
      await loadPlayingQueue();
    });

    // Toggle favorite (mirrors library behavior)
    const favEl = card.querySelector('.songFavCol');

    favEl.addEventListener('click', async (e) => {
      e.stopPropagation();

      const isCurrentlyFav = favEl.classList.contains('fav');
      const newFav = !isCurrentlyFav;

      //await window.electronAPI.setSongFavorite(song.id, newFav ? 1 : 0);
      const result = await window.electronAPI.setSongFavorite(song.id, newFav ? 1 : 0);
      if (result?.success) {
        const title = result.row.title;
        if (newFav) {
          showErrorMsg("info", `Added to Favorites: ${title}`);
        } 
        else {
          showErrorMsg("info", `Removed from Favorites: ${title}`);
        }
      }
      favEl.classList.toggle('fav', newFav);
      favEl.innerHTML = newFav ? favFilledSvg : favEmptySvg;
    });


    container.appendChild(card);
  }
}

document.addEventListener("contextmenu", (e) => {
    const item = e.target.closest(".playlistItem, .artistItem");
    if (!item) return;

    e.preventDefault();

    const type = item.dataset.type || "playlist";
    const id = item.dataset.id;
    const name = item.querySelector(".playlistName")?.textContent || "Item";

    if (type === "artist") {
        // --- Artist → media menu ---
        mediaCtxTarget = { id, name, type: "artist" };
        mediaCtxType = "artist";
        openMediaContextMenu(e.pageX, e.pageY, name);
        return;
    }

    // --- Playlist logic continues unchanged ---
    selectedPlaylistId = id;
    const isFixed = (id === "favorites" || id === "history");

    playlistContextMenu.querySelector('[data-action="editPL"]').style.display = isFixed ? "none" : "flex";
    playlistContextMenu.querySelector('[data-action="delete"]').style.display = isFixed ? "none" : "flex";

    playlistContextMenu.querySelector("#playlistCtxDivider").style.display = isFixed ? "none" : "block";
    playlistContextMenu.querySelector("#playlistCtxDivider2").style.display = isFixed ? "none" : "block";

    ctxPlaylistTitle.textContent = name;

    //positionMenu(playlistContextMenu, e.pageX, e.pageY);
    playlistContextMenu.style.display = "block";
    playlistContextMenu.style.visibility = "hidden";

    const menuW = playlistContextMenu.offsetWidth;
    const menuH = playlistContextMenu.offsetHeight;
    playlistContextMenu.style.visibility = "visible";

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x = e.pageX;
    let y = e.pageY;

    if (x + menuW > vw) x = vw - menuW - 5;
    if (y + menuH > vh) y = vh - menuH - 5;

    playlistContextMenu.style.left = x + "px";
    playlistContextMenu.style.top = y + "px";
    playlistContextMenu.style.display = "block";
});

function renderPlaylistList(containerId, playlists) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  playlists.forEach(pl => {
    const div = document.createElement("div");
    div.className = "playlistItem";
    div.dataset.id = pl.id;

    div.innerHTML = `
      <img class="playlistImage" src="${pl.image || pl.thumbnail || "images/albumph.png"}">
      <div class="playlistName">${pl.name}</div>
      <div class="playlistCount">${pl.count} ${pl.count === 1 ? "song" : "songs"}</div>
    `;

    div.addEventListener("click", () => {
      openPlaylist(pl.id)
    });

    container.appendChild(div);
  });
}


function renderArtistList(containerId, artists) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  artists.forEach(artist => {

    const arts = artist.albumArts || [];

    // Build collage HTML exactly like Artists Page
    let artHTML = "";
    if (arts.length >= 4) {
      artHTML = `
        <div class="artistCollage four">
          <img src="${arts[0]}">
          <img src="${arts[1]}">
          <img src="${arts[2]}">
          <img src="${arts[3]}">
        </div>`;
    } 
    else if (arts.length === 3) {
      artHTML = `
        <div class="artistCollage three">
          <div class="top">
            <img src="${arts[0]}">
            <img src="${arts[1]}">
          </div>
          <div class="bottom">
            <img src="${arts[2]}">
          </div>
        </div>`;
    } 
    else if (arts.length === 2) {
      artHTML = `
        <div class="artistCollage two">
          <img src="${arts[0]}">
          <img src="${arts[1]}">
        </div>`;
    } 
    else if (arts.length === 1) {
      artHTML = `
        <div class="artistCollage one">
          <img src="${arts[0]}">
        </div>`;
    } 
    else {
      artHTML = `
        <div class="artistCollage placeholder">
          <img src="images/artistph.png">
        </div>`;
    }

    const div = document.createElement('div');
    div.className = 'artistItem';
    div.dataset.id = artist.id;
    div.dataset.type = "artist";
    div.innerHTML = `
      ${artHTML}
      <div class="playlistName">${artist.name}</div>
    `;

    div.onclick = () => openArtistSongs(artist.id);

    container.appendChild(div);
  });
}

// Load home page data

async function loadHomePage() {

  const recentlyAdded = await window.electronAPI.getRecentlyAddedSongs();
  renderSongList('recentlyAddedSongs', recentlyAdded);
  toggleSection('recentlyAdded', recentlyAdded.length > 0);

  const recentlyPlayed = await window.electronAPI.getRecentlyPlayedSongs();
  renderSongList('recentlyPlayedSongs', recentlyPlayed);
  toggleSection('recentlyPlayed', recentlyPlayed.length > 0);

  const mostPlayed = await window.electronAPI.getMostPlayedSongs();
  renderSongList('mostPlayedSongs', mostPlayed);
  toggleSection('mostPlayed', mostPlayed.length > 0);

  const recentPlaylists = await window.electronAPI.getRecentPlaylists();
  renderPlaylistList('recentPlaylists', recentPlaylists);
  toggleSection('recentPlaylistsDiv', recentPlaylists.length > 0);

  const recentlyFavorited = await window.electronAPI.getRecentlyFavoritedSongs();
  renderSongList('recentlyFavoritedSongs', recentlyFavorited);
  toggleSection('recentlyFavorited', recentlyFavorited.length > 0);

  const mostFavoritedArtists = await window.electronAPI.getMostFavoritedArtists();
  renderArtistList('mostFavoritedArtists', mostFavoritedArtists);
  toggleSection('mostFavoritedArtistsDiv', mostFavoritedArtists.length > 0);

  // -------------------------
  // Detect if ALL sections are empty
  // -------------------------
  const totalItems =
    recentlyAdded.length +
    recentlyPlayed.length +
    mostPlayed.length +
    recentPlaylists.length +
    recentlyFavorited.length +
    mostFavoritedArtists.length;

  const welcome = document.getElementById("welcomeMessage");

  if (totalItems === 0) {
    welcome.style.display = "block";
  } 
  else {
    welcome.style.display = "none";
  }
}

function toggleSection(sectionId, hasData) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  section.style.display = hasData ? "block" : "none";
}

function updateFavoriteIcon(songId, isFav) {
  const filledHeart = `
    <svg class="heart" viewBox="0 -960 960 960">
      <path d="M480-142.33q-12 0-24.17-4.34Q443.67-151 434.67-160l-58.34-53.67q-118-109-207.16-210.5Q80-525.67 80-640q0-91.33 61.33-152.67 61.34-61.33 152-61.33Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.33Q880-731.33 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9 9-21.16 13.33-12.17 4.34-24.17 4.34Z"/>
    </svg>
  `;

  const emptyHeart = `
    <svg class="heart" viewBox="0 -960 960 960">
      <path d="M480-142.33q-11.8 0-24.02-4.25-12.22-4.25-21.49-13.59l-58.16-53.5q-118-109-207.16-210.5Q80-525.67 80-640q0-91.44 61.33-152.72 61.34-61.28 152-61.28Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.28Q880-731.44 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9.16 9.25-21.25 13.46-12.08 4.21-24.08 4.21Zm-30-543q-27.67-46.34-68-74.17t-88.67-27.83q-64 0-105.33 41.66-41.33 41.67-41.33 105.96 0 55.71 38.25 117.65 38.25 61.93 91.5 120.16T386.5-293.33q56.83 50.33 93.5 84 36.67-33 93.5-83.67t110-109.33Q736.67-461 775-522.96q38.33-61.96 38.33-117.04 0-64-41.66-105.67-41.67-41.66-105-41.66-49 0-89 27.5t-69 74.5q-5.67 8.66-13 12.66-7.34 4-16.34 4t-16.66-4q-7.67-4-12.67-12.66Zm30 187Z"/>
    </svg>
  `;

  // selectors for all types of UI containers
  const selectors = [
    `.songsRow[data-id="${songId}"] .songFavCol`,
    `.songCard[data-id="${songId}"] .songFavCol`
  ];

  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(favEl => {
      favEl.classList.toggle("fav", isFav);
      favEl.innerHTML = isFav ? filledHeart : emptyHeart;
    });
  });
}

// --------------- SETTINGS -----------------

// ------------------------SYNC FOLDERS ------------------------

const syncCheckbox = document.getElementById("syncFolders");

// Load current setting
window.electronAPI.getSyncWatch().then(enabled => {
  syncCheckbox.checked = enabled;
});

// When user toggles it
syncCheckbox.addEventListener("change", () => {
  const enabled = syncCheckbox.checked;
  window.electronAPI.setSyncWatch(enabled);
});

// HIDE BARS VIDEO---------------------

const hideBarsVideo = document.getElementById("hideBarsVideo");

// Load current setting
window.electronAPI.getHideBars().then(enabled => {
  hideBarsVideo.checked = enabled;
});

// When user toggles it
hideBarsVideo.addEventListener("change", () => {
  const enabled = hideBarsVideo.checked;
  window.electronAPI.setHideBars(enabled);
});

// --------VOLUME---------------------------

const volumeRadios = document.querySelectorAll('input[name="maxVolume"]');

// Load saved setting from backend
window.electronAPI.getMaxVolume().then(level => {
    const radio = document.querySelector(`input[name="maxVolume"][value="${level}"]`);
    if (radio) radio.checked = true;

    setMaxVolume(level);  // apply to player on load
});

// When user changes max volume
volumeRadios.forEach(r => {
    r.addEventListener("change", () => {
        const value = Number(r.value);

        window.electronAPI.setMaxVolume(value);  // save in backend
        setMaxVolume(value);                     // apply immediately
    });
});

// HOT-KEYS COMMANDS / HOTKEYS / KEYBINDS / KEY BINDINGS

const keySelErrorMsg = document.getElementById('keySelErrorMsg');

// Save a single keybind to the backend
async function saveSingleKeybind(keyName, keyDisplay, keyCode) {
    try {
        const res = await fetch('/save-keybind', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                key: keyName,
                value: keyDisplay,
                code: keyCode
            })
        });
        const data = await res.json();
        if (!data.success) {
            console.warn(`Failed to save keybind for ${keyName}`);
        }
    } catch (error) {
        console.error('Error saving keybind:', error);
    }
}

// Format key name for display
function formatKeyDisplay(key) {
    const map = {
        'ARROWUP': '↑',
        'ARROWDOWN': '↓',
        'ARROWLEFT': '←',
        'ARROWRIGHT': '→',
        'BACKSPACE': 'BSP',
        ' ': 'SPACE'
    };
    return map[key.toUpperCase()] || key.toUpperCase();
}

function formatKeyFromCode(code, key) {
    const codeMap = {
        'Quote': '~',
        'Backquote': '`',
        'BracketLeft': '[',
        'BracketRight': ']',
        'Backslash': '\\',
        'Minus': '-',
        'Equal': '=',
        'Semicolon': ';',
        'Comma': ',',
        'Period': '.',
        'IntlBackslash': '\\',
        'IntlRo': '/',
        'Slash': ';',
        // Add others as needed
    };

    if (codeMap[code]) return codeMap[code];

    // fallback to key, formatted
    if (key === ' ') return 'SPACE';
    return key.toUpperCase();
}

// Selector setup
const keySelName = document.getElementById('keySelName');
let keyDataName = '';
let keySelectorTargetDiv = null;
let currentKeybinds = {}; // key_name → { value: 'C', code: 'KeyC' }
let keySelectorMode = 0;

document.addEventListener('keydown', async function (event) {
    if (keySelectorMode == 1) {
        event.preventDefault();
        const forbiddenKeys = [
            'Control', 'Shift', 'Alt', 'AltGraph', 'Meta',
            'Tab', 'Escape', 'CapsLock', 'NumLock',
            'PrintScreen', 'ScrollLock', 'Pause',
            'Insert', 'Home', 'End', 'PageUp', 'PageDown',
            'F1', 'F5', 'F11', 'F12'
        ];
        //const keyDisplay = formatKeyDisplay(event.key);
        const displayKey = formatKeyFromCode(event.code, event.key);
        const keyCode = event.code;
        if (forbiddenKeys.includes(event.key)) {
            keySelErrorMsg.innerText = `Error: Invalid Key: ${displayKey}`;
        }
        else {
            //console.log(`You selected: ${displayKey} (${keyCode})`);
            await saveSingleKeybind(keyDataName, displayKey, keyCode);
            keySelectorMode = 0;
            keySelWin.style.display = 'none';
            document.getElementById('keyBackdrop').style.display = 'none';
            keySelErrorMsg.innerText = '';
            keySelName.innerText = '';
            keyDataName = '';
            await loadKeybinds();
        }
    } 
    else {
        if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) return;

        const focusedElement = document.activeElement;
        const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(focusedElement.tagName);
        if (isInputFocused && event.key !== 'Enter') return;

        const eventCode = event.code;

        // Define actions
        const keyActions = {
            key_char: () => toggleDivVisibility('charWindow'),
            key_inv: () => toggleDivVisibility('bagWindow'),
            key_spells: () => toggleDivVisibility('skillsWindow'),
            key_chat: () => startChat(),
            key_cameraCenter: () => centerOnCharacter()
        };

        for (const [keyName, action] of Object.entries(keyActions)) {
            const bind = currentKeybinds[keyName];
            if (bind && bind.code === eventCode) {
                action();
                return;
            }
        }

        // Escape key is always hardcoded
        if (event.key === 'Escape') {
            //toggleSettingsDiv();
        }
    }
});

// Load keybinds from the server and update UI
async function loadKeybinds() {
    try {
        const res = await fetch('/get-keybinds');
        const data = await res.json();

        if (!data || typeof data !== 'object') {
            console.warn('No keybind data received.');
            return;
        }

        currentKeybinds = {}; // reset

        // === Step 1: Clear all key display divs ===
        document.querySelectorAll('.keySelector').forEach(div => {
            div.innerText = ''; // Clear any previous value
        });

        for (const [key, value] of Object.entries(data)) {
            if (!key.startsWith('key_') || !value) continue;

            const codeKey = key + '_code';
            const codeValue = data[codeKey];

            // Store both display and code version
            currentKeybinds[key] = {
                value: formatKeyDisplay(value),
                code: codeValue
            };

            const elementId = key.replace('key_', 'keySelector_');
            const keyDiv = document.getElementById(elementId);
            if (keyDiv) keyDiv.innerText = formatKeyDisplay(value);
        }
    } catch (err) {
        console.error('Error fetching keybinds:', err);
    }
}

document.querySelectorAll('.keySelector').forEach(div => {
    div.addEventListener('click', function () {
        keySelectorMode = 1;
        keyDataName = div.dataset.keyname;   // e.g., 'key_char'
        keySelName.innerText = div.dataset.keydesc; // e.g., 'Character Window'
        keySelectorTargetDiv = div;
        keySelWin.style.display = 'block';
        document.getElementById('keyBackdrop').style.display = 'block';
        keySelErrorMsg.innerText = '';
    });
});

function toggleDivVisibility(divId) {
    const div = document.getElementById(divId);
    if (!div) return;
    if (div.style.display === 'none' || div.style.display === '') {
        toggleDiv(`#${divId}`);
    }
    else {
        div.style.display = 'none';
    }
}

/* ABOUT */

const helpGithub = document.getElementById('helpGithub');
helpGithub.onclick = () => {
  window.electronAPI.openExternal("https://github.com/hudsonpear");
};

const infoBtn = document.getElementById('infoBtn');
const aboutWindow = document.getElementById('aboutWindow');
const aboutCloseBtn = document.getElementById('aboutCloseBtn');
const copyIcon = document.getElementById("copyIcon");

copyIcon.onclick = function() {
  const textToCopy = "coolnewtabpage@gmail.com";
  copyToClipboard(textToCopy);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    //console.log("Copied to clipboard!");
  } 
  catch (err) {
    //console.error("Failed to copy text:", err);
  }
}

aboutCloseBtn.addEventListener('click', () => {
  aboutWindow.style.display = 'none';
});

infoBtn.onclick = function () {
    if (aboutWindow.style.display === 'none' || aboutWindow.style.display === '') {
       aboutWindow.style.display = 'block';
    }
    else {
        aboutWindow.style.display = 'none';
    }
};

const changLogDlg = document.getElementById('changLogDlg');

function openChangeLog() {
  loadChangelog();
  if (changLogDlg.style.display === 'none' || changLogDlg.style.display === '') {
      changLogDlg.style.display = 'flex';
  }
  else {
      changLogDlg.style.display = 'none';
  }
};

const menuAddSong = document.getElementById("menuAddSong");
const menuAddVideo = document.getElementById("menuAddVideo");
const menuAddMixFolder = document.getElementById("menuAddMixFolder");
const menuAddAudioFolder = document.getElementById("menuAddAudioFolder");
const menuAddVideoFolder = document.getElementById("menuAddVideoFolder");
const menuSettBtn = document.getElementById("menuSettBtn");
const menuReloadApp = document.getElementById("menuReloadApp");
const menuOpenConsole = document.getElementById("menuOpenConsole");
const menuAboutBtn = document.getElementById("menuAboutBtn");
const menuChangeBtn = document.getElementById("menuChangeBtn");

menuAddSong.onclick = function () {
  addSongsBtn.click();
};

menuAddVideo.onclick = function () {
  addVideosBtn.click();
};

menuAddMixFolder.onclick = function () {
  addFoldersBtn.click();
};

menuAddAudioFolder.onclick = function () {
  addAudioFoldersBtn.click();
};

menuAddVideoFolder.onclick = function () {
  addVideoFoldersBtn.click();
};

menuSettBtn.onclick = function () {
  settingsSideBtn.click();
};

menuReloadApp.onclick = async function () {
  await window.electronAPI.hardReload();
};

menuOpenConsole.onclick = async function () {
  pyrusMenu.classList.toggle('show');
  await window.electronAPI.openDevTools();
};

menuAboutBtn.onclick = function () {
  infoBtn.click();
};

menuChangeBtn.onclick = function () {
  pyrusMenu.classList.remove('show');
  openChangeLog();
};

// ------ DATA ------

document.getElementById('openDataFolder').onclick = () => {
  window.electronAPI.openDataFolder();
};

// ---------- FILE INFO ----------


async function openFileInfo(songID) {
  const song = await window.electronAPI.getSongById(songID);
  if (!song) return;

  const path = song.filePath;

  const info = await window.electronAPI.getFileInfo(path);
  renderFileInfo(info);

  document.getElementById("id3Dlg").style.display = "block";
}

function renderFileInfo(info) {
  const content = document.querySelector("#id3Dlg .id3Content");

  const albumArt = info.albumArt
    ? info.albumArt            // file:// URL from DB
    : "images/albumph.png";

  content.innerHTML = `
    <div class="fileInfoGrid">
      <img class="fileInfoArt" src="${albumArt}">
      <div class="fileInfoRow"><b>File name:</b> ${info.fileName}</div>
      <div class="fileInfoRow"><b>Path:</b> ${info.filePath}</div>
      <div class="fileInfoRow"><b>Size:</b> ${formatBytes(info.fileSize)}</div>
      <div class="fileInfoRow"><b>Created:</b> ${formatDate(info.createdTime)}</div>
      <div class="fileInfoRow"><b>Modified:</b> ${formatDate(info.modifiedTime)}</div>
      <hr>
      <div class="fileInfoRow"><b>Name:</b> ${info.title}</div>
      <div class="fileInfoRow"><b>Artist:</b> ${info.artist}</div>
      <div class="fileInfoRow"><b>Album:</b> ${info.album}</div>
      <div class="fileInfoRow"><b>Duration:</b> ${formatDuration(info.duration)}</div>
      <div class="fileInfoRow"><b>Genre:</b> ${info.genre}</div>
      <div class="fileInfoRow"><b>Year:</b> ${info.year}</div>
      <hr>
      <div class="fileInfoRow"><b>Codec:</b> ${info.codec}</div>
      <div class="fileInfoRow"><b>Bitrate:</b> ${Math.round(info.bitrate / 1000)} kbps</div>
      <div class="fileInfoRow"><b>Frequency:</b> ${info.frequency} Hz</div>
      <div class="fileInfoRow"><b>Comment:</b> ${info.comment}</div>
    </div>
  `;
}

function formatDate(ms) {
  return new Date(ms).toLocaleString();
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}


document.getElementById("closeId3").onclick =
document.getElementById("id3CloseBtn").onclick = () => {
  document.getElementById("id3Dlg").style.display = "none";
};

infoBtnDiv.onclick = () => {
  openFileInfo(currentSongId);
};


// ------------- VIDEO INFO DLG ----------------

async function openVideoInfo(videoID) {
  const video = await window.electronAPI.getVideoById(videoID);
  if (!video) return;

  const info = await window.electronAPI.getVideoFileInfo(video.filePath);
  renderVideoInfo(info);

  document.getElementById("vidInfoDlg").style.display = "block";
}

function renderVideoInfo(info) {
  const content = document.querySelector("#vidInfoDlg .vidInfoContent");

  const thumb = info.thumbnail
    ? info.thumbnail
    : "images/videoplaceholder.png";

  content.innerHTML = `
    <div class="videoInfoGrid">
      <img class="videoInfoArt" src="${thumb}">
      <div class="fileInfoRow"><b>File name:</b> ${info.fileName}</div>
      <div class="fileInfoRow"><b>Path:</b> ${info.filePath}</div>
      <div class="fileInfoRow"><b>Size:</b> ${formatBytes(info.fileSize)}</div>
      <div class="fileInfoRow"><b>Created:</b> ${formatDate(info.createdTime)}</div>
      <div class="fileInfoRow"><b>Modified:</b> ${formatDate(info.modifiedTime)}</div>
      <hr>
      <div class="fileInfoRow"><b>Duration:</b> ${formatDuration(info.duration)}</div>
      <div class="fileInfoRow"><b>Resolution:</b> ${info.width} × ${info.height}</div>
      <div class="fileInfoRow"><b>Aspect Ratio:</b> ${info.aspect}</div>
      <div class="fileInfoRow"><b>Frame Rate:</b> ${info.fps} fps</div>
      <hr>
      <div class="fileInfoRow"><b>Video Codec:</b> ${info.videoCodec}</div>
      <div class="fileInfoRow"><b>Video Bitrate:</b> ${Math.round(info.videoBitrate / 1000)} kbps</div>
      <hr>
      <div class="fileInfoRow"><b>Audio Codec:</b> ${info.audioCodec}</div>
      <div class="fileInfoRow"><b>Audio Bitrate:</b> ${Math.round(info.audioBitrate / 1000)} kbps</div>
      <div class="fileInfoRow"><b>Channels:</b> ${info.channels}</div>
      <div class="fileInfoRow"><b>Sample Rate:</b> ${info.sampleRate} Hz</div>
    </div>
  `;
}

document.getElementById("closeVidInfo").onclick =
document.getElementById("vidInfoCloseBtn").onclick = () => {
  document.getElementById("vidInfoDlg").style.display = "none";
};

//openVideoInfo(12); // opens dialog for video id=12
























// -=-=-=-=-=-=-= APIs =-=-=-=-=-=-=-=-

window.electronAPI.onQueueUpdated((event, data) => {
  //console.log("🔄 Playing queue updated:", data);
  renderPlayingQueue(data);
});

window.addEventListener("focus", () => {
    const video = document.querySelector("video");
    if (video && !video.paused) {
        const t = video.currentTime;
        video.currentTime = t; // forces sync flush
    }
});

window.addEventListener("focus", () => {
    const v = document.querySelector("video");
    if (!v || v.paused) return;

    const old = v.playbackRate;
    v.playbackRate = old + 0.001;

    requestAnimationFrame(() => {
        v.playbackRate = old;
    });
});

window.electronAPI.onFileRemoved((event, { songId, fileName }) => {
  const songRow = document.querySelector(`.songsRow[data-id="${songId}"]`);
  if (songRow) {
    songRow.remove();
    updateSongsCount();
    showErrorMsg('error', `File Removed: ${fileName}`);
  }
});

window.electronAPI.songAdded((event, { song, fileName }) => {
  if (song && song.id) {
    addSongToUI(song);
    showErrorMsg('info', `Song Added: ${fileName}`);
  }
});

window.electronAPI.songUpdated((event, { id, file, fileName }) => {
  if (id) {
    refreshSongRow(id);
    showErrorMsg('info', `Song Updated: ${fileName}`);
  }
});

window.electronAPI.videoAdded((event, { file, fileName }) => {
  if (fileName) {
    //CMD TO ADD TO LIST??
    showErrorMsg('info', `Video Added: ${fileName}.`);
  }
});

window.electronAPI.onFileRenamed((event, { oldPath, newPath, newFileName, newTitle, songId, videoId }) => {
  if (songId) {
    const row = document.querySelector(`.songsRow[data-id="${songId}"]`);
    if (row) {
      // Update title column
      const titleCol = row.querySelector('.songNameCol');
      if (titleCol) titleCol.textContent = newTitle;

      // Optionally update filename somewhere if displayed
      // Or update any tooltip, etc.
    }
    showErrorMsg('info', `File Renamed: ${newTitle}.`);
  }

  if (videoId) {
    // Similar logic for video rows if you display them
    showErrorMsg('info', `File Renamed: ${newTitle}.`);
  }

});

window.electronAPI.onIndexProgress((ev, payload) => {
  const { processed, total, message } = payload;
  const percent = total ? Math.round((processed/total)*100) : 0;
});

window.electronAPI.onToast((ev, obj) => {
  showErrorMsg(obj.type || 'info', obj.message || ''); 
});

window.electronAPI.onImportProgress(async (event, data)  =>  {
  const { processed, total } = data;
  const percent = Math.round((processed / total) * 100);

  // Update or create the progress toast
  showImportProgress(`Importing files... ${processed}/${total}`, percent);

  // When finished
  if (processed >= total) {
    //showImportProgress(`Done! Imported ${total} file(s)`, 100);

    setTimeout(() => {
        if (activeImportToast) {
            activeImportToast.remove();
            activeImportToast = null;
        }
    }, 1500);

    showErrorMsg("ok", `Imported ${total} file(s) successfully!`);

    await loadSongs();
    await loadFoldersUI();
    await loadVideos();
  }
});

window.electronAPI.updatePlaybackState({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  title: '',
  artist: ''
});

window.electronAPI.onControl( async (action) => {
  if (action === 'play') {
    playPauseBtn.click();
  } 
  else if (action === 'pause') {
    playPauseBtn.click();
  }
  else if (action === 'prev') {
    nextBtnDiv.click();
  }
  else if (action === 'next') {
    prevBtnDiv.click();
  }
});

//-------- ADD SONG TO PLAYLIST -------------

let addSongToPlaylist_Selected = new Set();
let addSongToPlaylist_SongID = null;

async function openAddSongToPlaylistDialog(songId) {
  addSongToPlaylist_Selected.clear();
  addSongToPlaylist_SongID = songId;

  const dlg = document.getElementById("addSongToPlaylistDlg");
  const list = document.getElementById("addSongToPlaylist_List");

  dlg.style.display = "flex";
  list.innerHTML = "";

  const playlists = await window.electronAPI.getAllPlaylists();

  playlists.forEach(pl => {
    const div = document.createElement("div");
    div.className = "playlistItem addToPlaylistItem";
    div.dataset.id = pl.id;

    div.innerHTML = `
      <img class="playlistImage" src="${pl.thumbnail || "images/albumph.png"}">
      <div class="playlistName">${pl.name}</div>
      <div class="playlistCount">${pl.count} ${pl.count === 1 ? "song" : "songs"}</div>
    `;

    div.addEventListener("click", () => {
      if (addSongToPlaylist_Selected.has(pl.id)) {
        addSongToPlaylist_Selected.delete(pl.id);
        div.classList.remove("selected");
      } else {
        addSongToPlaylist_Selected.add(pl.id);
        div.classList.add("selected");
      }
    });

    list.appendChild(div);
  });
}

document.getElementById("addSongToPlaylistDlgCloseBtn").onclick = () => {
  document.getElementById("addSongToPlaylistDlg").style.display = "none";
};

document.getElementById("addSongToPlaylist_CancelBtn").onclick = () => {
  document.getElementById("addSongToPlaylistDlg").style.display = "none";
};

document.getElementById("addSongToPlaylist_AddBtn").onclick = async () => {
  if (addSongToPlaylist_Selected.size === 0) {
    showErrorMsg("error", "Select at least one playlist.");
    return;
  }

  const result = await window.electronAPI.addSongToPlaylists(
    addSongToPlaylist_SongID,
    Array.from(addSongToPlaylist_Selected)
  );

  if (result.success) {
    showErrorMsg("info", "Song added to selected playlists.");
    updateAddToPlaylistIcon(addSongToPlaylist_SongID);
  } 
  else {
    showErrorMsg("error", "Failed to add the song.");
  }

  document.getElementById("addSongToPlaylistDlg").style.display = "none";
};

window.electronAPI.onOpenFile(async (filePath) => {
  console.log("Renderer received external file:", filePath);

  const lower = filePath.toLowerCase();
  const isVideo =
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mkv") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".m4v");

  if (isVideo) {
    await playExternalVideo(filePath);
    return;
  }

  // Otherwise fall back to audio logic
  await playExternalFile(filePath);
});


async function playExternalVideo(filePath) {
  try {
    showVideoPlayer();

    video.pause();
    video.removeAttribute("src");
    video.load();

    const src = window.electronAPI.toURL(filePath);
    video.src = src;

    video.addEventListener("canplay", function onReady() {
      video.removeEventListener("canplay", onReady);
      video.play().catch(err => console.warn("Autoplay failed:", err));

      videoIsPlaying = true;
      videoIsEnded = false;
      videoLoaded = true;
      showingVideoPlayer = true;
      lastSection = "videos";
      videoDotDiv.classList.add("videoDot");
    });

    // Hide bars logic
    const hideBars = await window.electronAPI.getHideBars();
    if (hideBars) {
      sideBarDiv.classList.add("collapsed");
      sideBarBtn.classList.remove("active");
      playBarDiv.classList.add("collapsed");
      playlistPanel.classList.add("collapsed");
      updateMiddleMargin();
    }

    // Optional: clear audio UI
    isPlaying = false;
    currentSongId = null;
    playingSong = null;
  }
  catch (err) {
    console.error("playExternalVideo error:", err);
  }
}


async function playExternalFile(filePath) {
  try {
    // Stop current playback
    if (isPlaying) {
      audio.pause();
      audio.currentTime = 0;
    }

    isExternalPlayback = true;
    currentSongId = null;

    // 🔥 get metadata from main
    const songMetadata = await window.electronAPI.getExternalSongInfo(filePath);

    playingSong = songMetadata;

    // Decode waveform (reuse your existing logic)
    const nodeBuffer = await window.electronAPI.getSongBuffer(filePath);

    const arrayBuffer = nodeBuffer.buffer.slice(
      nodeBuffer.byteOffset,
      nodeBuffer.byteOffset + nodeBuffer.byteLength
    );

    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    waveformData = extractWaveform(audioBuffer);
    drawWaveform(waveformData);

    // Play
    audio.src = window.electronAPI.toURL(filePath);
    audio.load();
    audio.play();
    isPlaying = true;

    // UI update (same as library)
    playBarAlbumCover.classList.remove("hidden");
    playBarAlbumCover.src = songMetadata.albumArt || "images/albumph.png";

    songNameDiv.innerText = songMetadata.title;
    artistNameDiv.innerText = songMetadata.artist;
    albumNameDiv.innerText = songMetadata.album;

    playIcon.classList.remove("active");
    pauseIcon.classList.add("active");

    window.electronAPI.updatePlaybackState({
      isPlaying,
      currentTime: 0,
      duration: songMetadata.duration,
      title: songMetadata.title,
      artist: songMetadata.artist
    });
  } 
  catch (err) {
    console.error("playExternalFile error:", err);
  }
}

/* -------------- CHANGELOG ------------------ */

// Function to load changelog.txt into the <pre>
async function loadChangelog() {
  try {
    const response = await fetch('changelog.txt');
    if (!response.ok) throw new Error('Failed to load changelog');
    const text = await response.text();
    document.getElementById('changelogContent').textContent = text;
  } 
  catch (e) {
    document.getElementById('changelogContent').textContent = 'Error loading changelog.';
    console.error(e);
  }
}

// Close dialog handlers
document.getElementById('closeChangeLog').addEventListener('click', () => {
  document.getElementById('changLogDlg').style.display = 'none';
});

document.getElementById('changeCloseBtn').addEventListener('click', () => {
  document.getElementById('changLogDlg').style.display = 'none';
});

/* ---- SONG LIST SORT BUTTON ----- */

document.querySelectorAll('#sortDropdownSongList .sortOption').forEach(option => {
  option.addEventListener('click', async () => {
    const sortKey = option.dataset.sort;

    setActiveSortOptionSongList(sortKey);

    await window.electronAPI.setSongLibrarySort(sortKey);

    sortSongs(sortKey);

    sortDropdownSongList.style.display = 'none';
  });
});

function loadSongsFromList(songs) {
  const songsList = document.getElementById('songsList');
  songsList.innerHTML = '';

  // Update total songs count
  const totalSongsEl = document.getElementById('songsTotalNumber');
  if (songs.length >= 1) {
    totalSongsEl.innerText = songs.length === 1 ? `1 Song` : `${songs.length} Songs`;
  } 
  else {
    totalSongsEl.innerText = 'No Songs';
  }

  for (const song of songs) {
    // Example:
    const albumArtPath = song.albumArt && song.albumArt.trim() !== '' 
      ? song.albumArt 
      : 'images/albumph.png';

    const isFav = song.isFavorite;
    const favStatus = song.isFavorite ? 'fav' : '';
    const favIcon = isFav
      ? `<svg class="heart" viewBox="0 -960 960 960"><path d="M480-142.33q-12 0-24.17-4.34Q443.67-151 434.67-160l-58.34-53.67q-118-109-207.16-210.5Q80-525.67 80-640q0-91.33 61.33-152.67 61.34-61.33 152-61.33Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.33Q880-731.33 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9 9-21.16 13.33-12.17 4.34-24.17 4.34Z"/></svg>`
      : `<svg class="heart" viewBox="0 -960 960 960"><path d="M480-142.33q-11.8 0-24.02-4.25-12.22-4.25-21.49-13.59l-58.16-53.5q-118-109-207.16-210.5Q80-525.67 80-640q0-91.44 61.33-152.72 61.34-61.28 152-61.28Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.28Q880-731.44 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9.16 9.25-21.25 13.46-12.08 4.21-24.08 4.21Zm-30-543q-27.67-46.34-68-74.17t-88.67-27.83q-64 0-105.33 41.66-41.33 41.67-41.33 105.96 0 55.71 38.25 117.65 38.25 61.93 91.5 120.16T386.5-293.33q56.83 50.33 93.5 84 36.67-33 93.5-83.67t110-109.33Q736.67-461 775-522.96q38.33-61.96 38.33-117.04 0-64-41.66-105.67-41.67-41.66-105-41.66-49 0-89 27.5t-69 74.5q-5.67 8.66-13 12.66-7.34 4-16.34 4t-16.66-4q-7.67-4-12.67-12.66Zm30 187Z"/></svg>`;

    const duration = formatDuration(song.duration);

    const row = document.createElement('div');
    row.className = 'songsRow';
    row.dataset.id = song.id;
    row.innerHTML = `
      <div class="songArtCol">
        <div class="albumArtWrapper">
          <img src="${albumArtPath}" alt="">
          <div class="playOverlay" data-id="${song.id}">▶</div>
        </div>
      </div>
      <div class="songNameCol">${song.title}</div>
      <div class="songArtistCol">${song.artist || 'Unknown Artist'}</div>
      <div class="songAlbumCol">${song.albumName || 'Unknown Album'}</div>
      <div class="songYearCol">${song.year || ''}</div>
      <div class="songFavCol ${favStatus}">${favIcon}</div>
      <div class="songDurationCol">${duration}</div>
    `;

    const favEl = row.querySelector('.songFavCol');
    favEl.addEventListener('click', async (e) => {
      e.stopPropagation();

      const isCurrentlyFav = favEl.classList.contains('fav');
      const newFavStatus = !isCurrentlyFav;

      const result = await window.electronAPI.setSongFavorite(song.id, newFavStatus ? 1 : 0);
      if (result?.success) {
        const title = result.row.title;
        if (newFavStatus) {
          showErrorMsg("info", `Added to Favorites: ${title}`);
        } else {
          showErrorMsg("info", `Removed from Favorites: ${title}`);
        }
      }

      favEl.classList.toggle('fav', newFavStatus);

      favEl.innerHTML = newFavStatus
        ? `<svg class="heart" viewBox="0 -960 960 960"><path d="M480-142.33q-12 0-24.17-4.34Q443.67-151 434.67-160l-58.34-53.67q-118-109-207.16-210.5Q80-525.67 80-640q0-91.33 61.33-152.67 61.34-61.33 152-61.33Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.33Q880-731.33 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9 9-21.16 13.33-12.17 4.34-24.17 4.34Z"/></svg>`
        : `<svg class="heart" viewBox="0 -960 960 960"><path d="M480-142.33q-11.8 0-24.02-4.25-12.22-4.25-21.49-13.59l-58.16-53.5q-118-109-207.16-210.5Q80-525.67 80-640q0-91.44 61.33-152.72 61.34-61.28 152-61.28Q345-854 394-830.17q49 23.84 86 74.17 40.33-50.33 87.33-74.17 47-23.83 99.34-23.83 90.66 0 152 61.28Q880-731.44 880-640q0 114.33-89 216T583.33-213.33l-58 53.33q-9.16 9.25-21.25 13.46-12.08 4.21-24.08 4.21Zm-30-543q-27.67-46.34-68-74.17t-88.67-27.83q-64 0-105.33 41.66-41.33 41.67-41.33 105.96 0 55.71 38.25 117.65 38.25 61.93 91.5 120.16T386.5-293.33q56.83 50.33 93.5 84 36.67-33 93.5-83.67t110-109.33Q736.67-461 775-522.96q38.33-61.96 38.33-117.04 0-64-41.66-105.67-41.67-41.66-105-41.66-49 0-89 27.5t-69 74.5q-5.67 8.66-13 12.66-7.34 4-16.34 4t-16.66-4q-7.67-4-12.67-12.66Zm30 187Z"/></svg>`;
    });

    // Handle double-click to play the song
    row.addEventListener('dblclick', async (e) => {
      if (e.target.closest('.songFavCol')) {
        // Click on heart — do nothing here to prevent play
        return;
      }

      document.querySelectorAll('.songsRow.selectedRow')
      .forEach(r => r.classList.remove('selectedRow'));

      row.classList.add('selectedRow');

      await playCommand(song.id, currentSongList);
      // 🔹 Reload playing queue UI after new queue is saved
      await loadPlayingQueue();
    });

    // Handle play icon click
    row.querySelector('.playOverlay').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (e.target.closest('.songFavCol')) {
        // Click on heart — do nothing here to prevent play
        return;
      }
      document.querySelectorAll('.songsRow.selectedRow')
      .forEach(r => r.classList.remove('selectedRow'));
      row.classList.add('selectedRow');

      await playCommand(song.id, currentSongList);
      // 🔹 Reload playing queue UI after new queue is saved
      await loadPlayingQueue();
    });

    // Append row
    songsList.appendChild(row);
  }
}


document.addEventListener('DOMContentLoaded', async function() {
  document.body.classList.remove("loading");
});
