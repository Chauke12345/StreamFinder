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

const loadingSpinner =
document.getElementById("loadingSpinner");



const rows = {

trending:
document.getElementById("trendingRow"),

topRated:
document.getElementById("topRatedRow"),

nowPlaying:
document.getElementById("nowPlayingRow"),

upcoming:
document.getElementById("upcomingRow"),

popular:
document.getElementById("popularRow"),


action:
document.getElementById("actionRow"),

comedy:
document.getElementById("comedyRow"),

crime:
document.getElementById("crimeRow"),

horror:
document.getElementById("horrorRow"),

scifi:
document.getElementById("scifiRow"),

drama:
document.getElementById("dramaRow")

};



/* ========================
 FAVORITES
======================== */

let favorites =
JSON.parse(localStorage.getItem("favorites")) || [];





/* ========================
 EVENTS
======================== */


if(searchBtn){

searchBtn.addEventListener(
"click",
searchMovies
);

}



if(movieInput){

movieInput.addEventListener(
"keypress",
(e)=>{

if(e.key==="Enter"){

searchMovies();

}

});

}



if(closeModalBtn){

closeModalBtn.onclick =
closeModal;

}



if(modal){

modal.onclick=(e)=>{

if(e.target===modal){

closeModal();

}

};

}





/* ========================
 API FETCH
======================== */


async function fetchMovies(endpoint){


try{


const url =
`https://api.themoviedb.org/3${endpoint}&api_key=${apiKey}`;


const response =
await fetch(url);



if(!response.ok){

throw new Error(
"API Error"
);

}



const data =
await response.json();



return data.results || [];



}

catch(error){


console.error(
"FETCH ERROR:",
error
);


message.textContent =
"Unable to load movies";


return [];


}


}







async function fetchMovieDetails(id){


try{


const response =
await fetch(

`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=credits,videos`

);



return await response.json();


}
catch(error){

console.log(error);

return null;

}


}




// ========================
// WATCH PROVIDERS
// ========================

async function fetchWatchProviders(id){


try{


const response =
await fetch(

`https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${apiKey}`

);



const data =
await response.json();



return data.results?.ZA || null;



}
catch(error){


console.log(
"Provider error:",
error
);


return null;


}


}







/* ========================
 SEARCH
======================== */


async function searchMovies(){


const name =
movieInput.value.trim();



if(!name){

message.textContent =
"Enter movie name";

return;

}



message.textContent =
"Loading...";



const movies =
await fetchMovies(
`/search/movie?query=${encodeURIComponent(name)}`
);



if(!movies.length){

message.textContent =
"No movies found";

return;

}



message.textContent="";



displayMovies(
movies,
searchRow
);


}






/* ========================
 DISPLAY
======================== */

function displayMovies(movies, container){


if(!container) return;


container.innerHTML = "";



movies.forEach(movie=>{


const card = document.createElement("div");


card.className = "movie-card";



const poster = movie.poster_path

?
`https://image.tmdb.org/t/p/w500${movie.poster_path}`

:

"https://via.placeholder.com/300x450";



card.innerHTML = `


<img 

src="${poster}"

class="movie-poster"

alt="${movie.title || movie.name}"


>


<div class="movie-info">


<h3>

${movie.title || movie.name}

</h3>



<p>

⭐ ${
movie.vote_average
?
movie.vote_average.toFixed(1)
:
"N/A"
}

</p>



<p>

${
movie.release_date
?
movie.release_date.substring(0,4)
:
""

}

</p>



<button class="favorite-btn">

❤️ Favorite

</button>



</div>


`;




// ==========================
// POSTER CLICK
// ==========================

const posterImage =
card.querySelector(".movie-poster");


posterImage.onclick = ()=>{

console.log("POSTER CLICKED:", movie);

openMovieDetails(movie);

};




// ==========================
// FAVORITE BUTTON
// ==========================

const fav =
card.querySelector(".favorite-btn");



fav.onclick = (e)=>{


e.stopPropagation();


toggleFavorite(movie.id);


};




container.appendChild(card);



});


}


/* ========================
   MOVIE DETAILS MODAL
======================== */

async function openMovieDetails(movie){

    loadingSpinner.classList.remove("hidden");

    try {

        const details =
        await fetchMovieDetails(movie.id);


        const providers =
        await fetchWatchProviders(movie.id);


        if(!details){
            return;
        }


        modal.classList.remove("hidden");


        const poster =
        details.poster_path
        ?
        `https://image.tmdb.org/t/p/w500${details.poster_path}`
        :
        "https://via.placeholder.com/300x450";


        const genres =
        details.genres
        ?
        details.genres
        .map(g=>g.name)
        .join(", ")
        :
        "N/A";


        const cast =
        details.credits
        ?
        details.credits.cast
        .slice(0,5)
        .map(c=>c.name)
        .join(", ")
        :
        "N/A";


        const trailer =
        details.videos
        ?
        details.videos.results.find(
            v =>
            v.site === "YouTube" &&
            v.type === "Trailer"
        )
        :
        null;


        let providerHTML =
        "No streaming providers found";


        if(providers && providers.flatrate){

            providerHTML =
            providers.flatrate
            .map(provider=>`

                <span class="provider">
                    ${provider.provider_name}
                </span>

            `)
            .join("");

        }


        modalBody.innerHTML = `

            <h2>${details.title}</h2>

            <img src="${poster}" width="250">


            <p>
            ⭐ Rating: ${details.vote_average}
            </p>


            <p>
            🎭 Genres: ${genres}
            </p>


            <p>
            👥 Cast: ${cast}
            </p>


            <p>
            ${details.overview || "No description"}
            </p>


            <h3>
            📺 Available On
            </h3>

            <div class="providers">
            ${providerHTML}
            </div>


            ${
            trailer
            ?
            `
            <a target="_blank"
            href="https://youtube.com/watch?v=${trailer.key}">
            ▶ Watch Trailer
            </a>
            `
            :
            ""
            }


            <button onclick="toggleFavorite(${details.id})">
            ❤️ Favorite
            </button>

        `;


    }

    catch(error){

        console.log(
            "MOVIE DETAILS ERROR:",
            error
        );

    }


    finally{

        loadingSpinner.classList.add("hidden");

    }

}


async function openMovieDetails(movie){

    loadingSpinner.classList.remove("hidden");

    try {

        const details = await fetchMovieDetails(movie.id);

        const providers = await fetchWatchProviders(movie.id);


        if(!details){
            return;
        }


        const poster =
        details.poster_path
        ?
        `https://image.tmdb.org/t/p/w500${details.poster_path}`
        :
        "https://via.placeholder.com/300x450";


        const genres =
        details.genres
        ?
        details.genres.map(g=>g.name).join(", ")
        :
        "N/A";


        const cast =
        details.credits
        ?
        details.credits.cast
        .slice(0,5)
        .map(c=>c.name)
        .join(", ")
        :
        "N/A";


        const trailer =
        details.videos
        ?
        details.videos.results.find(
            v =>
            v.site === "YouTube" &&
            v.type === "Trailer"
        )
        :
        null;



        let providerHTML =
        "No streaming providers found";


        if(providers && providers.flatrate){

            providerHTML =
            providers.flatrate
            .map(provider=>`

                <span class="provider">
                    ${provider.provider_name}
                </span>

            `)
            .join("");

        }



        modal.classList.remove("hidden");


        modalBody.innerHTML = `

            <h2>${details.title}</h2>

            <img src="${poster}" width="250">


            <p>
            ⭐ Rating: ${details.vote_average}
            </p>


            <p>
            🎭 Genres: ${genres}
            </p>


            <p>
            ⏱ Runtime: ${details.runtime || "N/A"} minutes
            </p>


            <p>
            👥 Cast: ${cast}
            </p>


            <p>
            ${details.overview || "No description"}
            </p>


            <h3>
            📺 Available On
            </h3>


            <div class="providers">
            ${providerHTML}
            </div>


            ${
            trailer
            ?
            `
            <a target="_blank"
            href="https://youtube.com/watch?v=${trailer.key}">
            ▶ Watch Trailer
            </a>
            `
            :
            ""
            }


            <button onclick="toggleFavorite(${details.id})">
            ❤️ Favorite
            </button>

        `;


    }
    catch(error){

        console.log(
        "MOVIE DETAILS ERROR:",
        error
        );

    }
    finally{

        loadingSpinner.classList.add("hidden");

    }

}


/* ========================
 FAVORITES
======================== */


function toggleFavorite(id){


if(favorites.includes(id)){


favorites =
favorites.filter(
x=>x!==id
);


}

else{


favorites.push(id);


}



localStorage.setItem(
"favorites",
JSON.stringify(favorites)
);



alert(
"Favorites updated"
);


}








/* ========================
 GENRES
======================== */


function fetchGenreMovies(id){


return fetchMovies(
`/discover/movie?with_genres=${id}`
);


}







/* ========================
 LOAD HOME PAGE
======================== */


async function loadMovieSections(){


if(rows.trending)

displayMovies(
await fetchMovies("/trending/movie/week?"),
rows.trending
);



if(rows.topRated)

displayMovies(
await fetchMovies("/movie/top_rated?"),
rows.topRated
);



if(rows.nowPlaying)

displayMovies(
await fetchMovies("/movie/now_playing?"),
rows.nowPlaying
);



if(rows.upcoming)

displayMovies(
await fetchMovies("/movie/upcoming?"),
rows.upcoming
);



if(rows.popular)

displayMovies(
await fetchMovies("/movie/popular?"),
rows.popular
);



if(rows.action)

displayMovies(
await fetchGenreMovies(28),
rows.action
);



if(rows.comedy)

displayMovies(
await fetchGenreMovies(35),
rows.comedy
);



if(rows.crime)

displayMovies(
await fetchGenreMovies(80),
rows.crime
);



if(rows.horror)

displayMovies(
await fetchGenreMovies(27),
rows.horror
);



if(rows.scifi)

displayMovies(
await fetchGenreMovies(878),
rows.scifi
);



if(rows.drama)

displayMovies(
await fetchGenreMovies(18),
rows.drama
);



}




/* ========================
 START APP
======================== */


window.addEventListener(
"DOMContentLoaded",
()=>{

loadMovieSections();

});

function closeModal(){

    modal.classList.add("hidden");

}