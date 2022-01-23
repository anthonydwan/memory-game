import React, { useState, useEffect } from "react";
import uniqid from "uniqid";

function MainComp() {
  const [currCards, setCurrCards] = useState({});
  const [deckID, setDeckID] = useState(0);
  const [pileCreated, setPileCreated] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const checkInPile = async (card) => {
    if (!pileCreated) {
      setScore((prevScore) => prevScore + 1);
      setBestScore((prevBestScore) => Math.max(prevBestScore, score+1));
      console.log("CREATING PILE");
      await addToPile(card);
      setPileCreated(true);
    } else {
      const cardArr = await listPile();
      if (cardArr.map((element) => element.code).includes(card)) {
        console.log("REPEAT!");
        setScore(0);
      } else {
        setScore((prevScore) => prevScore + 1);
        setBestScore((prevBestScore) => Math.max(prevBestScore, score+1));
        console.log("NOT REPEAT!");
        await addToPile(card);
        //
      }
    }
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
      setIsLoading(false);
      return id;
    } catch {
      setIsError(true);
    }
  };

  const drawCard = async (id = null, numCard = 10) => {
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

  const addToPile = async (code, id = deckID, pileName = "chosen") => {
    await fetch(
      `https://deckofcardsapi.com/api/deck/${id}/pile/${pileName}/add/?cards=${code}`,
      { mode: "cors" }
    );
  };

  const listPile = async (id = deckID, pileName = "chosen") => {
    const response = await fetch(
      `http://deckofcardsapi.com/api/deck/${id}/pile/${pileName}/list/`,
      { mode: "cors" }
    );
    const currPileCheck = await response.json();
    console.log(currPileCheck.piles.chosen.cards);
    return currPileCheck.piles.chosen.cards;
  };

  useEffect(() => {
    const deckID = getDeckIDFromAPI();
    deckID.then((str) => setDeckID(str));
    drawCard(deckID, 10).then((obj) => setCurrCards(obj.cards));
  }, []);

  const handleClick = async (e) => {
    const chosen = await e.target.getAttribute("data-code");
    console.log(`adding to pile ${chosen}`);
    await checkInPile(chosen);
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
