import { stringify } from "query-string";
import { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";

// api - https://swapi.dev/
// 1. customers want to have a list of the characters
// ...?

type Character = {
  name: string;
  birth_year: string;
  films: string[];
};

type Query = {
  search?: string;
  page?: number;
};

type Film = {
  title: string;
  producer: string;
  release_date: string;
  opening_crawl: string;
};

let controller: AbortController;

const fetchCharacters = async (query: Query = {}) => {
  if (controller) {
    controller.abort();
  }
  controller = new AbortController();
  const signal = controller.signal;
  const queryStr = stringify(query);
  const response = await fetch(`https://swapi.dev/api/people?${queryStr}`, {
    signal
  }).catch(() => null);

  if (!response) {
    return null;
  }

  return response.json();
};

const fetchFilm = async (url: string) => {
  const response = await fetch(url);

  return response.json();
};

export default function App() {
  const [search, setSearch] = useState("");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isFetching, setFetching] = useState(false);
  const [films, setFilms] = useState<Film[]>([]);
  let timer = useRef<number | null>(null);

  const filmsUrls = useMemo(() => {
    const uniqFilms = new Set<string>();

    characters.forEach((char) => {
      char.films.forEach((film) => uniqFilms.add(film));
    });

    return Array.from(uniqFilms);
  }, [characters]);

  useEffect(() => {
    Promise.all(filmsUrls.map(fetchFilm)).then(setFilms);
  }, [filmsUrls]);

  useEffect(() => {
    setFetching(true);
    fetchCharacters().then((data) => {
      if (!data) return;
      setCharacters(data.results);
      setFetching(false);
    });
  }, []);

  useEffect(() => {
    const query = { search };
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      fetchCharacters(query).then((data) => {
        if (!data) return;
        setCharacters(data.results);
      });
    }, 1000);
  }, [search, isFetching]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearch(e.target.value);

  return (
    <div>
      <h2>Characters</h2>
      Search: <input value={search} onChange={handleInputChange} />
      <ul className="charactersList">
        {characters.map((person) => (
          <li key={person.name}>
            {person.name} <span>({person.birth_year})</span>{" "}
          </li>
        ))}
      </ul>
      <h2>Movies</h2>
      <ul className="filmsList">
        {films.map((film) => (
          <li key={film.title}>
            <h3>{film.title}</h3>
            <p>{film.opening_crawl}</p>
            <span>
              {film.release_date} {film.producer}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
