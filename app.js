// Music Player Application
class MusicPlayer {
  constructor() {
    this.audio = document.getElementById("audio");
    this.currentTrackIndex = 0;
    this.isPlaying = false;
    this.isShuffle = false;
    this.repeatMode = 'none'; // 'none', 'one', 'all'
    this.volume = 0.5;
    this.playlist = JSON.parse(localStorage.getItem("playlist")) || [];
    this.likedTracks = JSON.parse(localStorage.getItem("likedTracks")) || [];
    this.currentTheme = localStorage.getItem("theme") || "dark";
    this.isAutoScroll = true;
    this.fontSize = 1;
    
    this.initializeElements();
    this.setupEventListeners();
    this.setupAudioEvents();
    this.renderPlaylist();
    this.setTheme(this.currentTheme);
    this.updateVolumeSlider();
  }

  initializeElements() {
    // Player controls
    this.playPauseBtn = document.getElementById("playPauseBtn");
    this.prevBtn = document.getElementById("prevBtn");
    this.nextBtn = document.getElementById("nextBtn");
    this.shuffleBtn = document.getElementById("shuffleBtn");
    this.repeatBtn = document.getElementById("repeatBtn");
    this.likeBtn = document.getElementById("likeBtn");
    
    // Progress and volume
    this.progressBar = document.getElementById("progressBar");
    this.progressFill = document.getElementById("progressFill");
    this.progressHandle = document.getElementById("progressHandle");
    this.currentTimeEl = document.getElementById("currentTime");
    this.durationEl = document.getElementById("duration");
    this.volumeSlider = document.getElementById("volumeSlider");
    
    // Track info
    this.albumArt = document.getElementById("albumArt");
    this.trackTitle = document.getElementById("trackTitle");
    this.trackArtist = document.getElementById("trackArtist");
    
    // Playlist
    this.playlistEl = document.getElementById("playlist");
    this.playlistCount = document.getElementById("playlistCount");
    
    // Lyrics
    this.lyricsDisplay = document.getElementById("lyricsDisplay");
    this.autoScrollBtn = document.getElementById("autoScrollBtn");
    this.fontSizeBtn = document.getElementById("fontSizeBtn");
    
    // UI controls
    this.themeToggle = document.getElementById("themeToggle");
    this.menuToggle = document.getElementById("menuToggle");
    this.searchInput = document.getElementById("searchInput");
    this.searchClear = document.getElementById("searchClear");
    this.songFile = document.getElementById("songFile");
    
    // Mobile navigation
    this.mobileNav = document.getElementById("mobileNav");
    this.navOverlay = document.getElementById("navOverlay");
    this.navClose = document.getElementById("navClose");
  }

  setupEventListeners() {
    // Playback controls
    this.playPauseBtn.addEventListener("click", () => this.togglePlayPause());
    this.prevBtn.addEventListener("click", () => this.previousTrack());
    this.nextBtn.addEventListener("click", () => this.nextTrack());
    this.shuffleBtn.addEventListener("click", () => this.toggleShuffle());
    this.repeatBtn.addEventListener("click", () => this.toggleRepeat());
    this.likeBtn.addEventListener("click", () => this.toggleLike());
    
    // Progress bar
    this.progressBar.addEventListener("click", (e) => this.seekTo(e));
    this.progressBar.addEventListener("mousedown", () => this.startSeeking());
    
    // Volume control
    this.volumeSlider.addEventListener("input", (e) => this.setVolume(e.target.value / 100));
    
    // File upload
    this.songFile.addEventListener("change", (e) => this.handleFileUpload(e));
    
    // Search functionality
    this.searchInput.addEventListener("input", (e) => this.searchTracks(e.target.value));
    this.searchClear.addEventListener("click", () => this.clearSearch());
    
    // Theme toggle
    this.themeToggle.addEventListener("click", () => this.toggleTheme());
    
    // Mobile navigation
    this.menuToggle.addEventListener("click", () => this.toggleMobileNav());
    this.navOverlay.addEventListener("click", () => this.closeMobileNav());
    this.navClose.addEventListener("click", () => this.closeMobileNav());
    
    // Lyrics controls
    this.autoScrollBtn.addEventListener("click", () => this.toggleAutoScroll());
    this.fontSizeBtn.addEventListener("click", () => this.cycleFontSize());
    
    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => this.handleKeyboard(e));
  }

  setupAudioEvents() {
    this.audio.addEventListener("loadedmetadata", () => this.updateDuration());
    this.audio.addEventListener("timeupdate", () => this.updateProgress());
    this.audio.addEventListener("ended", () => this.handleTrackEnd());
    this.audio.addEventListener("play", () => this.handlePlay());
    this.audio.addEventListener("pause", () => this.handlePause());
    this.audio.addEventListener("error", (e) => this.handleError(e));
  }

  // Playback Controls
  togglePlayPause() {
    if (this.audio.src) {
      if (this.isPlaying) {
        this.audio.pause();
      } else {
        this.audio.play();
      }
    } else if (this.playlist.length > 0) {
      this.playTrack(0);
    }
  }

  playTrack(index) {
    if (index >= 0 && index < this.playlist.length) {
      this.currentTrackIndex = index;
      const track = this.playlist[index];
      
      this.audio.src = track.fileDataUrl;
      this.albumArt.src = track.albumArtDataUrl || "default-art.png";
      this.trackTitle.textContent = this.extractTrackName(track.name);
      this.trackArtist.textContent = track.artist || "Unknown Artist";
      
      this.audio.play();
      this.updatePlaylistUI();
      this.updateLikeButton();
      this.loadLyrics(track);
      
      // Add playing class for animations
      document.body.classList.add('playing');
    }
  }

  previousTrack() {
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }
    
    let prevIndex;
    if (this.isShuffle) {
      prevIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      prevIndex = this.currentTrackIndex - 1;
      if (prevIndex < 0) {
        prevIndex = this.repeatMode === 'all' ? this.playlist.length - 1 : 0;
      }
    }
    this.playTrack(prevIndex);
  }

  nextTrack() {
    let nextIndex;
    if (this.isShuffle) {
      nextIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      nextIndex = this.currentTrackIndex + 1;
      if (nextIndex >= this.playlist.length) {
        nextIndex = this.repeatMode === 'all' ? 0 : this.currentTrackIndex;
      }
    }
    this.playTrack(nextIndex);
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.shuffleBtn.classList.toggle('active', this.isShuffle);
    this.showTooltip(this.shuffleBtn, this.isShuffle ? 'Shuffle on' : 'Shuffle off');
  }

  toggleRepeat() {
    const modes = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(currentIndex + 1) % modes.length];
    
    this.repeatBtn.classList.toggle('active', this.repeatMode !== 'none');
    
    const icon = this.repeatBtn.querySelector('span');
    if (this.repeatMode === 'one') {
      icon.textContent = '🔂';
    } else {
      icon.textContent = '🔁';
    }
    
    const tooltipText = {
      'none': 'Repeat off',
      'all': 'Repeat all',
      'one': 'Repeat one'
    };
    this.showTooltip(this.repeatBtn, tooltipText[this.repeatMode]);
  }

  toggleLike() {
    const currentTrack = this.playlist[this.currentTrackIndex];
    if (!currentTrack) return;
    
    const trackId = this.getTrackId(currentTrack);
    const isLiked = this.likedTracks.includes(trackId);
    
    if (isLiked) {
      this.likedTracks = this.likedTracks.filter(id => id !== trackId);
    } else {
      this.likedTracks.push(trackId);
    }
    
    localStorage.setItem("likedTracks", JSON.stringify(this.likedTracks));
    this.updateLikeButton();
    this.showTooltip(this.likeBtn, isLiked ? 'Removed from liked' : 'Added to liked');
  }

  // File Upload
  handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const track = {
          name: file.name,
          fileDataUrl: ev.target.result,
          albumArtDataUrl: "",
          artist: this.extractArtistFromFilename(file.name),
          duration: 0,
          dateAdded: new Date().toISOString()
        };
        
        this.addToPlaylist(track);
        this.playTrack(this.playlist.length - 1);
      };
      reader.readAsDataURL(file);
    }
  }

  addToPlaylist(track) {
    this.playlist.push(track);
    localStorage.setItem("playlist", JSON.stringify(this.playlist));
    this.renderPlaylist();
    this.updatePlaylistCount();
  }

  removeFromPlaylist(index) {
    this.playlist.splice(index, 1);
    localStorage.setItem("playlist", JSON.stringify(this.playlist));
    this.renderPlaylist();
    this.updatePlaylistCount();
    
    if (index === this.currentTrackIndex) {
      if (this.playlist.length > 0) {
        this.playTrack(Math.min(index, this.playlist.length - 1));
      } else {
        this.audio.src = "";
        this.trackTitle.textContent = "No track selected";
        this.trackArtist.textContent = "Unknown Artist";
        this.albumArt.src = "default-art.png";
      }
    } else if (index < this.currentTrackIndex) {
      this.currentTrackIndex--;
    }
  }

  // Search Functionality
  searchTracks(query) {
    const items = this.playlistEl.querySelectorAll('.playlist-item');
    const lowerQuery = query.toLowerCase();
    
    items.forEach(item => {
      const title = item.querySelector('.playlist-item-title').textContent.toLowerCase();
      const isVisible = title.includes(lowerQuery);
      item.style.display = isVisible ? 'flex' : 'none';
    });
  }

  clearSearch() {
    this.searchInput.value = '';
    this.searchTracks('');
  }

  // UI Updates
  renderPlaylist() {
    this.playlistEl.innerHTML = "";
    this.playlist.forEach((track, index) => {
      const li = document.createElement("li");
      li.className = "playlist-item";
      li.innerHTML = `
        <div class="playlist-item-icon">
          <span>🎵</span>
        </div>
        <div class="playlist-item-info">
          <div class="playlist-item-title">${this.extractTrackName(track.name)}</div>
          <div class="playlist-item-duration">${track.artist || 'Unknown Artist'}</div>
        </div>
      `;
      
      li.addEventListener("click", () => this.playTrack(index));
      this.playlistEl.appendChild(li);
    });
    this.updatePlaylistCount();
  }

  updatePlaylistUI() {
    const items = this.playlistEl.querySelectorAll('.playlist-item');
    items.forEach((item, index) => {
      item.classList.toggle('active', index === this.currentTrackIndex);
    });
  }

  updatePlaylistCount() {
    const count = this.playlist.length;
    this.playlistCount.textContent = `${count} track${count !== 1 ? 's' : ''}`;
  }

  updateLikeButton() {
    const currentTrack = this.playlist[this.currentTrackIndex];
    if (!currentTrack) return;
    
    const trackId = this.getTrackId(currentTrack);
    const isLiked = this.likedTracks.includes(trackId);
    
    const icon = this.likeBtn.querySelector('span');
    icon.textContent = isLiked ? '❤️' : '🤍';
    this.likeBtn.classList.toggle('active', isLiked);
  }

  updateProgress() {
    if (this.audio.duration) {
      const progress = (this.audio.currentTime / this.audio.duration) * 100;
      this.progressFill.style.width = `${progress}%`;
      this.progressHandle.style.left = `${progress}%`;
      
      this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
      this.updateLyrics();
    }
  }

  updateDuration() {
    this.durationEl.textContent = this.formatTime(this.audio.duration);
  }

  updateVolumeSlider() {
    this.volumeSlider.value = this.volume * 100;
    this.audio.volume = this.volume;
  }

  // Audio Event Handlers
  handlePlay() {
    this.isPlaying = true;
    this.playPauseBtn.querySelector('span').textContent = '⏸️';
    document.body.classList.add('playing');
  }

  handlePause() {
    this.isPlaying = false;
    this.playPauseBtn.querySelector('span').textContent = '▶️';
    document.body.classList.remove('playing');
  }

  handleTrackEnd() {
    if (this.repeatMode === 'one') {
      this.audio.currentTime = 0;
      this.audio.play();
    } else {
      this.nextTrack();
    }
  }

  handleError(e) {
    console.error('Audio error:', e);
    this.showTooltip(this.playPauseBtn, 'Error playing track');
  }

  // Seeking
  seekTo(e) {
    if (this.audio.duration) {
      const rect = this.progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      this.audio.currentTime = percent * this.audio.duration;
    }
  }

  startSeeking() {
    this.isSeeking = true;
    const handleMouseMove = (e) => this.seekTo(e);
    const handleMouseUp = () => {
      this.isSeeking = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.audio.volume = this.volume;
  }

  // Theme Management
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(this.currentTheme);
    localStorage.setItem("theme", this.currentTheme);
  }

  setTheme(theme) {
    document.querySelector('.app-container').setAttribute('data-theme', theme);
    const icon = this.themeToggle.querySelector('span');
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // Mobile Navigation
  toggleMobileNav() {
    this.mobileNav.classList.toggle('active');
  }

  closeMobileNav() {
    this.mobileNav.classList.remove('active');
  }

  // Lyrics Management
  loadLyrics(track) {
    // For now, show placeholder lyrics
    // In a real implementation, this would fetch lyrics from an API
    this.lyricsDisplay.innerHTML = `
      <div class="no-lyrics">
        <span style="font-size: 3rem;">🎵</span>
        <p>No lyrics available</p>
        <p class="subtitle">Playing: ${this.extractTrackName(track.name)}</p>
      </div>
    `;
  }

  updateLyrics() {
    // Placeholder for lyrics synchronization
    // Would implement time-based lyrics highlighting here
  }

  toggleAutoScroll() {
    this.isAutoScroll = !this.isAutoScroll;
    this.autoScrollBtn.classList.toggle('active', this.isAutoScroll);
    this.showTooltip(this.autoScrollBtn, this.isAutoScroll ? 'Auto-scroll on' : 'Auto-scroll off');
  }

  cycleFontSize() {
    this.fontSize = this.fontSize >= 1.5 ? 0.8 : this.fontSize + 0.1;
    this.lyricsDisplay.style.fontSize = `${this.fontSize}rem`;
    this.showTooltip(this.fontSizeBtn, `Font size: ${Math.round(this.fontSize * 100)}%`);
  }

  // Keyboard Shortcuts
  handleKeyboard(e) {
    if (e.target.tagName === 'INPUT') return;
    
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        this.togglePlayPause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.audio.currentTime -= 10;
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.audio.currentTime += 10;
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.setVolume(this.volume + 0.1);
        this.updateVolumeSlider();
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.setVolume(this.volume - 0.1);
        this.updateVolumeSlider();
        break;
      case 'KeyN':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.nextTrack();
        }
        break;
      case 'KeyP':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.previousTrack();
        }
        break;
      case 'KeyL':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.toggleLike();
        }
        break;
    }
  }

  // Utility Functions
  extractTrackName(filename) {
    return filename.replace(/\.[^/.]+$/, "").replace(/^\d+\s*[-.\s]*/, "");
  }

  extractArtistFromFilename(filename) {
    // Simple heuristic to extract artist from filename
    const withoutExt = filename.replace(/\.[^/.]+$/, "");
    const parts = withoutExt.split(/[-–—]/);
    return parts.length > 1 ? parts[0].trim() : "Unknown Artist";
  }

  getTrackId(track) {
    return `${track.name}_${track.dateAdded}`;
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  showTooltip(element, text) {
    // Simple tooltip implementation
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
      position: absolute;
      background: var(--bg-secondary);
      color: var(--text-primary);
      padding: 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      z-index: 1000;
      pointer-events: none;
      box-shadow: 0 2px 8px var(--shadow);
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
    
    setTimeout(() => {
      tooltip.remove();
    }, 2000);
  }
}

// Initialize the music player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.musicPlayer = new MusicPlayer();
});

// Legacy support for existing playlist
function renderPlaylist() {
  if (window.musicPlayer) {
    window.musicPlayer.renderPlaylist();
  }
}
