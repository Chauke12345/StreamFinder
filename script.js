const apiKey = "ea292e4c40d0ce47cfd359567e94bf48";

/* ========================
   DOM ELEMENTS
======================== */
const movieInput = document.getElementById("movieInput");
const searchBtn = document.getElementById("searchBtn");
const searchRow = document.getElementById("searchRow");


const message = document.getElementById("message");

const modal = document.getElementById("movieModal");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModal");
const trendingRow = document.getElementById("trendingRow");
const actionRow = document.getElementById("actionRow");
const comedyRow = document.getElementById("comedyRow");
const crimeRow = document.getElementById("crimeRow");
const thrillerRow = document.getElementById("thrillerRow");

/* ========================
   FAVORITES
======================== */
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

/* ========================
   EVENTS
======================== */
searchBtn.addEventListener("click", searchMovies);

movieInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchMovies();
});

closeModalBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

/* ========================
   SEARCH MOVIES
======================== */
async function searchMovies() {
  console.log("SEARCH CLICKED");

  const movieName = movieInput.value.trim();

  if (!movieName) {
    message.textContent = "Please enter a movie name.";
    return;
  }

  message.textContent = "Loading...";

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(movieName)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    console.log("STATUS:", res.status);
    console.log("DATA:", data);

    if (!res.ok) {
      message.textContent = "API Error: " + data.status_message;
      return;
    }

    if (!data.results || data.results.length === 0) {
      message.textContent = "No movies found.";
      searchRow.innerHTML = "";
      return;
    }

    message.textContent = "";

    // 🔥 FIXED LINE
    displayMovies(data.results, searchRow);

  } catch (err) {
    console.error("ERROR:", err);
    message.textContent = "Network error. Check console.";
  }
}
/* ========================
   DISPLAY MOVIES
======================== */
function displayMovies(movies, container) {

  container.innerHTML = movies.map(movie => {

    const posterPath = movie.poster_path;

    const poster = posterPath
      ? `https://image.tmdb.org/t/p/w500${posterPath}`
      : "https://via.placeholder.com/300x450?text=No+Poster";

    return `
      <div class="movie-card" onclick='openModal(${JSON.stringify(movie).replace(/"/g, "&quot;")})'>

        <img 
          src="${poster}" 
          alt="${movie.title}"
          onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'"
        />

        <div class="movie-info">
          <h3>${movie.title}</h3>
          <p>⭐ ${movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}</p>
        </div>

      </div>
    `;
  }).join("");
}
/* ========================
   MODAL
======================== */
function openModal(movie) {

  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  modalBody.innerHTML = `
    <h2>${movie.title}</h2>

    <img src="${poster}" style="width:100%; border-radius:10px;" />

    <p><strong>⭐ Rating:</strong> ${movie.vote_average || "N/A"}</p>
    <p><strong>📅 Release:</strong> ${movie.release_date || "Unknown"}</p>

    <p style="margin-top:10px;">
      ${movie.overview || "No description available."}
    </p>

    <button onclick="toggleFavorite(${movie.id})">
      ❤️ ${favorites.includes(movie.id) ? "Remove Favorite" : "Add to Favorites"}
    </button>

    <button onclick="loadTrailer(${movie.id})">
      ▶ Watch Trailer
    </button>

    <div id="trailerContainer"></div>
  `;

  loadTrailer(movie.id);
}

/* ========================
   CLOSE MODAL
======================== */
function closeModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "auto";
}

/* ========================
   TRAILER
======================== */
async function loadTrailer(movieId) {
  const container = document.getElementById("trailerContainer");

  // 1. Loading state
  container.innerHTML = "<p>Loading trailer...</p>";

  const url = `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    console.log("TRAILER DATA:", data);

    // 2. No results
    if (!data.results || data.results.length === 0) {
      container.innerHTML = "<p>No trailer available.</p>";
      return;
    }

    // 3. Smart trailer selection
    const trailer =
      data.results.find(v => v.site === "YouTube" && v.type === "Trailer") ||
      data.results.find(v => v.site === "YouTube") ||
      null;

    if (!trailer || !trailer.key) {
      container.innerHTML = `
        <p>No playable trailer found.</p>
        <a href="https://www.youtube.com/results?search_query=movie+trailer"
           target="_blank">
           ▶ Search on YouTube
        </a>
      `;
      return;
    }

    const embedUrl = `https://www.youtube.com/embed/${trailer.key}?rel=0`;

    // 4. Render player + fallback
    container.innerHTML = `
      <iframe
        width="100%"
        height="315"
        src="${embedUrl}"
        frameborder="0"
        allow="autoplay; encrypted-media"
        allowfullscreen>
      </iframe>

    <p style="margin-top:10px;">
  If video doesn’t load:
  <a href="https://www.youtube.com/watch?v=${trailer.key}" target="_blank">
    ▶ Watch on YouTube
  </a>
</p>
    `;

  } catch (err) {
    console.error(err);

    container.innerHTML = `
      <p>Error loading trailer.</p>
      <a href="https://www.youtube.com/results?search_query=movie+trailer"
         target="_blank">
         ▶ Search on YouTube
      </a>
    `;
  }
}
/* ========================
   FAVORITES
======================== */
function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
}

/* =========================================
   SCROLL MOVIE ROW (Netflix-style arrows)
   - Moves the movie row left or right
========================================= */
function scrollRow(btn, direction) {
  const rowContainer = btn.closest(".movie-row");
  const row = rowContainer?.querySelector(".movie-track");

  if (!row) return;

  row.scrollBy({
    left: direction * 300,
    behavior: "smooth"
  });
}

/* =========================================
   SHOW LOADING SKELETON
   - Displays placeholder cards while data loads
========================================= */
function showLoading() {
  moviesDiv.innerHTML = `
    <div class="skeleton-row">
      ${Array(6).fill(`
        <div class="skeleton-card"></div>
      `).join("")}
    </div>
  `;
}


/* =========================================
   LOAD TRENDING MOVIES (TMDB API)
   - Fetches trending movies from API
   - Displays them on page load
========================================= */
async function loadTrendingMovies() {

  // Show loading animation first
  showLoading();

  // TMDB trending movies endpoint
  const url = `https://api.themoviedb.org/3/trending/movie/day?api_key=${apiKey}`;

  try {
    // Fetch data from API
    const res = await fetch(url);
    const data = await res.json();

    console.log("TRENDING:", data); // Debug output

    // Check if results exist
    if (!data.results || data.results.length === 0) {
      message.textContent = "No trending movies found.";
      return;
    }

    // Clear loading / messages
    message.textContent = "";

    // Render movies on screen
    displayMovies(data.results, trendingRow);

  } catch (err) {
    // Handle API or network errors
    console.error("TRENDING ERROR:", err);
    message.textContent = "Failed to load trending movies.";
  }
}


/* =========================================
   AUTO LOAD TRENDING MOVIES ON PAGE LOAD
   - Runs function when page finishes loading
========================================= */
window.addEventListener("DOMContentLoaded", () => {
  loadTrendingMovies();
  loadActionMovies();
  loadComedyMovies();
  loadCrimeMovies();
  loadThrillerMovies();
});

async function fetchMovies(url, containerId) {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error("Missing container:", containerId);
    return;
  }

  container.innerHTML = `
    <div class="skeleton-row">
      ${Array(6).fill(`<div class="skeleton-card"></div>`).join("")}
    </div>
  `;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("API request failed: " + res.status);
    }

    const data = await res.json();

    console.log("DATA for", containerId, data);

    if (!data.results || data.results.length === 0) {
      container.innerHTML = "<p>No movies found</p>";
      return;
    }

    container.innerHTML = data.results.map(movie => {

      const poster = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "https://via.placeholder.com/300x450?text=No+Poster";

      return `
        <div class="movie-card" onclick='openModal(${JSON.stringify(movie).replace(/"/g, "&quot;")})'>
          <img src="${poster}" />
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error("FETCH ERROR:", err);
    container.innerHTML = "<p>Failed to load movies</p>";
  }
}

async function loadActionMovies() {

  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=28`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    displayMovies(data.results, actionRow);

  } catch (err) {
    console.error("ACTION ERROR:", err);
  }
}

async function loadComedyMovies() {

  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=35`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    displayMovies(data.results, comedyRow);

  } catch (err) {
    console.error("COMEDY ERROR:", err);
  }
}

async function loadCrimeMovies() {

  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=80`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    displayMovies(data.results, crimeRow);

  } catch (err) {
    console.error("CRIME ERROR:", err);
  }
}

async function loadThrillerMovies() {

  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=53`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    displayMovies(data.results, thrillerRow);

  } catch (err) {
    console.error("THRILLER ERROR:", err);
  }
}