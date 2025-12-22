import React, { useEffect, useState } from "react";
import MaskedWord from "./MaskedWord";
import { semanticMap } from "./semanticMap";
import confetti from "canvas-confetti";

interface WikiPage {
  title: string;
  extract: string;
  url: string;
}

const PedantleGame: React.FC = () => {
  const [page, setPage] = useState<WikiPage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [guessedWords, setGuessedWords] = useState<Set<string>>(new Set());
  const [pastGuesses, setPastGuesses] = useState<string[]>([]);

  const getDayOfYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff =
      now.getTime() -
      start.getTime() +
      (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const normalizeWord = (word: string) =>
    word.replace(/[^\w]/g, "").toLowerCase();

  const addPluralForms = (word: string) => {
    const plurals = new Set<string>();
    plurals.add(word);
    if (word.endsWith("s")) plurals.add(word.slice(0, -1));
    else plurals.add(word + "s");
    return plurals;
  };

  const fetchArticleByIndex = async (index: number) => {
    try {
      setLoading(true);
      setError(null);
      setGuessedWords(new Set());
      setPastGuesses([]);
      setInputValue("");

      const res = await fetch(
        "https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Featured_articles&cmlimit=366&format=json&origin=*"
      );
      const data = await res.json();
      const articles = data.query.categorymembers;
      const article = articles[index % articles.length];

      const pageRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|info&inprop=url&titles=${encodeURIComponent(
          article.title
        )}&format=json&origin=*`
      );
      const pageData = await pageRes.json();
      const pageId = Object.keys(pageData.query.pages)[0];
      const pageInfo = pageData.query.pages[pageId];

      setPage({
        title: pageInfo.title,
        extract: pageInfo.extract,
        url: pageInfo.fullurl,
      });
    } catch {
      setError("Failed to load article.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRandomExtraArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      setGuessedWords(new Set());
      setPastGuesses([]);
      setInputValue("");

      const res = await fetch(
        "https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Featured_articles&cmlimit=500&format=json&origin=*"
      );
      const data = await res.json();
      const articles = data.query.categorymembers.slice(366);
      if (!articles || articles.length === 0) {
        setError("No additional articles available.");
        return;
      }
      const randomArticle =
        articles[Math.floor(Math.random() * articles.length)];

      const pageRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|info&inprop=url&titles=${encodeURIComponent(
          randomArticle.title
        )}&format=json&origin=*`
      );
      const pageData = await pageRes.json();
      const pageId = Object.keys(pageData.query.pages)[0];
      const pageInfo = pageData.query.pages[pageId];

      setPage({
        title: pageInfo.title,
        extract: pageInfo.extract,
        url: pageInfo.fullurl,
      });
    } catch {
      setError("Failed to load article.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticleByIndex(getDayOfYear() - 1);
  }, []);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const guess = normalizeWord(inputValue.trim());
      if (!guess) return;

      if (!guessedWords.has(guess)) {
        let newGuessed = new Set(guessedWords);
        addPluralForms(guess).forEach((w) => newGuessed.add(w));

        if (semanticMap[guess]) {
          semanticMap[guess].forEach((w) => newGuessed.add(w));
        }

        setGuessedWords(newGuessed);
        setPastGuesses([...pastGuesses, guess]);
      }

      // if guessed already, just highlight again (guessedWords already has it)

      setInputValue("");
    }
  };

  const renderMaskedParagraphs = () => {
    if (!page) return null;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = page.extract;

    const paragraphs = Array.from(tempDiv.querySelectorAll("p")).filter((p) => {
      const text = (p.textContent || "").replace(/\n/g, " ").trim();
      return text.split(/\s+/).length >= 20;
    });

    return paragraphs.map((p, idx) => {
      const words = (p.textContent || "")
        .replace(/\n/g, " ")
        .split(/(\s+|\b)/)
        .filter(Boolean);

      return (
        <p key={idx} className="mb-4">
          {words.map((word, i) => {
            const cleanWord = normalizeWord(word);
            const revealed = guessedWords.has(cleanWord);
            return (
              <MaskedWord key={i} word={word} revealed={revealed} />
            );
          })}
        </p>
      );
    });
  };

  const isTitleFullyGuessed = () => {
    if (!page) return false;
    const titleWords = page.title.split(/\s+/).map((w) => normalizeWord(w));
    return titleWords.every((word) => guessedWords.has(word));
  };

  useEffect(() => {
    if (isTitleFullyGuessed()) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.3 },
      });
    }
  }, [guessedWords]);

  return (
    <div className="w-screen h-screen p-6 bg-white overflow-y-auto">
      {loading && <p className="text-center">Loading article...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && page && (
        <>
          {/* Masked Title */}
          <h1 className="text-3xl font-bold mb-6 flex flex-wrap gap-1">
            {page.title.split(/\s+/).map((word, idx) => {
              const cleanWord = normalizeWord(word);
              const revealed = guessedWords.has(cleanWord);
              return (
                <MaskedWord key={idx} word={word} revealed={revealed} />
              );
            })}
          </h1>

          <div className="mb-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a word and press Enter..."
              className="border rounded px-3 py-2 w-full"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Main article */}
            <div className="flex-1">{renderMaskedParagraphs()}</div>

            {/* Past guesses list */}
            <div className="w-48 p-2 border rounded bg-gray-50">
              <h2 className="font-bold mb-2 text-center">Past Guesses</h2>
              <ol className="list-decimal list-inside text-sm">
                {pastGuesses.map((guess, idx) => (
                  <li key={idx}>{guess}</li>
                ))}
              </ol>
            </div>
          </div>

          <a
            href={page.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Read more on Wikipedia
          </a>

          <button
            onClick={fetchRandomExtraArticle}
            className="mt-4 ml-4 px-4 py-2 bg-blue-600 text-black rounded hover:bg-blue-700"
          >
            Load Another Article
          </button>
        </>
      )}
    </div>
  );
};

export default PedantleGame;
