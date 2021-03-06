import React, { useState, useEffect } from "react";
import uniqid from "uniqid";
import spade from "../Spades.svg";
import github from "../github.png";

function MainComp() {
  const [currCards, setCurrCards] = useState({});
  const [deckID, setDeckID] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [lostGame, setLostGame] = useState(false);

  const [drawn, setDrawn] = useState([]);
  const [memory, setMemory] = useState([]);

  const checkInPile = async (card) => {
    if (memory.map((c) => c.code).includes(card)) {
      setLostGame(true);
    } else {
      setScore((prevScore) => prevScore + 1);
      setBestScore((prevBestScore) => Math.max(prevBestScore, score + 1));
      setMemory([...memory, currCards.find((c) => c.code === card)]);
      setDrawn([...drawn, ...currCards.filter((c) => !drawn.includes(c))]);
      const newCards = await redraw();
      setCurrCards(newCards);
    }
  };

  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * arr.length);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const drawFromDrawn = (num) => {
    if (drawn.length === 0) {
      return shuffle(currCards.slice(0, num));
    } else {
      setDrawn(shuffle(drawn));
      return drawn.slice(0, num);
    }
  };

  const drawFromDeckAPI = async (num, id = deckID) => {
    const response = await fetch(
      `https://deckofcardsapi.com/api/deck/${id}/draw/?count=${num}`,
      { mode: "cors" }
    );
    const drawn = await response.json();
    const drawnCards = await drawn;
    return drawnCards.cards;
  };

  const redraw = async () => {
    let recycle = Math.floor(Math.random() * 10);
    const otherCards = await drawFromDeckAPI(10 - recycle);
    if (otherCards.length + recycle < 10) {
      recycle = 10 - otherCards.length;
    }
    const oldCards = drawFromDrawn(recycle);
    return [...oldCards, ...otherCards];
  };

  const getDeckIDFromAPI = async () => {
    try {
      const response = await fetch(
        "https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1",
        {
          mode: "cors",
        }
      );
      const res = await response.json();
      const id = await res.deck_id;
      setIsLoading(false);
      return id;
    } catch {
      setIsError(true);
    }
  };

  const initDraw = async (id = null, numCard = 10) => {
    try {
      const deckID = id === null ? await getDeckIDFromAPI() : await id;
      const response = await fetch(
        `https://deckofcardsapi.com/api/deck/${deckID}/draw/?count=${numCard}`,
        {
          mode: "cors",
        }
      );
      const drawnCards = await response.json();
      return drawnCards;
    } catch {
      setIsError(true);
    }
  };

  const reset = async () => {
    const deckID = await getDeckIDFromAPI();
    await setDeckID(deckID);
    await initDraw(deckID, 10).then((obj) => setCurrCards(obj.cards));
    setDrawn([]);
    setMemory([]);
    setScore(0);
    setLostGame(false);
  };

  useEffect(() => {
    (async () => {
      const deckID = await getDeckIDFromAPI();
      await setDeckID(deckID);
      await initDraw(deckID, 10).then((obj) => setCurrCards(obj.cards));
    })();
  }, []);

  const handleClick = (e) => {
    const chosen = e.target.getAttribute("data-code");
    checkInPile(chosen);
  };

  return (
    <React.Fragment>
      <a href="https://github.com/anthonydwan/memory-game">
        <img className="github" src={github} alt="github" />
      </a>
      <header>
        <h1>
          <img alt="spade" src={spade} width="45" /> Memory Game{" "}
          <img alt="spade" src={spade} width="45" />
        </h1>

        <div className="scoreContainer">
          <span>Current Score: {score}</span>
          <span>Best Score: {bestScore}</span>
        </div>
        <h2>Do not pick the same card twice!</h2>
      </header>
      <main>
        {Object.keys(currCards).map((key) => {
          const url = currCards[key].image;
          return (
            <img
              className="cards"
              onClick={handleClick}
              key={uniqid()}
              data-code={currCards[key].code}
              src={url}
              alt={currCards[key].code}
            />
          );
        })}
      </main>
      <footer className="buttonSection">
        {lostGame && <button onClick={reset}>Game Over</button>}
      </footer>
    </React.Fragment>
  );
}

export default MainComp;
