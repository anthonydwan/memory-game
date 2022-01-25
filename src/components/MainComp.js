import React, { useState, useEffect } from "react";
import uniqid from "uniqid";

function MainComp() {
  const [currCards, setCurrCards] = useState({});
  const [deckID, setDeckID] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [pileList, setPileList] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const drawn = []
  const memory = []


  // const addToPile = (card) => {
  //   setPileList((prevPileList) => [...prevPileList, card]);
  // };

  const checkInPile = async (card) => {
    if (memory.includes(card)) {
      console.log("REPEAT!");
      setScore(0);
    } else {
      setScore((prevScore) => prevScore + 1);
      setBestScore((prevBestScore) => Math.max(prevBestScore, score + 1));
      console.log("NOT REPEAT!");
      memory.push(card)
    }
    await addToPileAPI(card)
      .then(() => returnToDeck(card))
      .then(() => printPiles())
      // .then(() => redraw())
      .then(() => printPiles())
      .catch(() => console.log("Failed!!"));
  };

  const returnToDeck = async (card) => {
    console.log(
      `returning ${currCards
        .map((c) => c.code)
        .filter((c) => c !== card && !pileList.includes(c))
        .join(",")}`
    );
    await fetch(
      `https://deckofcardsapi.com/api/deck/${deckID}/return/?cards=${currCards
        .map((c) => c.code)
        .filter((c) => c !== card && !pileList.includes(c))
        .join(",")}`
    )
      .then(() => console.log(`returned to deck`))
      .catch(() => console.log("did not return to deck!"));
  };

  const printPiles = async () => {
    const print = await fetch(
      `https://deckofcardsapi.com/api/deck/${deckID}/pile/drawn/list/`,
      { mode: "cors" }
    );
    const printjson = await print.json();
    await console.log(printjson.piles.drawn.cards);
  };

  const drawFromPileAPI = async (num, id = deckID, pileName = "drawn") => {
    const response = await fetch(
      `https://deckofcardsapi.com/api/deck/${id}/pile/${pileName}/draw/?count=1`,
      { mode: "cors" }
    );
    const drawn = await response.json();
    const drawnCards = await drawn;
    return drawnCards;
  };

  const drawFromDeckAPI = async (num, id = deckID) => {
    const response = await fetch(
      `https://deckofcardsapi.com/api/deck/${id}/draw/?count=${num}`,
      { mode: "cors" }
    );
    const drawn = await response.json();
    const drawnCards = await drawn;
    return drawnCards;
  };

  const redraw = async (id = deckID, pileName = "drawn") => {
    console.log("redraw!");
    // const fromPileNum = Math.min(pileList.length, 9);
    // const newCards = await drawFromPileAPI(1);
    const [drawnFromPile, drawnFromDeck] = await Promise.all([
      drawFromPileAPI(1),
      drawFromDeckAPI(9),
    ]);
    const newCards = [...drawnFromPile.cards, ...drawnFromDeck.cards];
    console.log(newCards);
    setCurrCards(newCards);
  };

  const updatePileAPI = async (card, id = deckID, pileName = "drawn") => {
    console.log(card);
    await fetch(`https://deckofcardsapi.com/api/deck/${id}/shuffle/`);
  };

  const addToPileAPI = async (code, id = deckID, pileName = "drawn") => {
    console.log(`adding ${code},${pileList.join(",")} to pile`);
    await fetch(
      `https://deckofcardsapi.com/api/deck/${id}/pile/${pileName}/add/?cards=${code},${pileList.join(
        ","
      )}`,
      { mode: "cors" }
    )
      .then(() => console.log(`added to pile`))
      .catch(() => console.log("did not add to pile!"));
  };

  const getDeckIDFromAPI = async () => {
    try {
      const response = await fetch(
        "http://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1",
        {
          mode: "cors",
        }
      );
      const res = await response.json();
      const id = await res.deck_id;
      console.log(id);
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
    <div>
      <div>
        Current Score {score} Best Score {bestScore}
      </div>
      <h1>{deckID}</h1>
      {Object.keys(currCards).map((key) => {
        const url = currCards[key].image;
        return (
          <img
            onClick={handleClick}
            key={uniqid()}
            data-code={currCards[key].code}
            src={url}
            alt={currCards[key].code}
          />
        );
      })}
    </div>
  );
}

export default MainComp;
