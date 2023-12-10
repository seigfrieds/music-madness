import React, { useState } from "react";
import Match from "./Match.js";
import VictoryPage from "./VictoryPage.jsx";
import { useRef } from "react";
import "./MatchPage.css";

type Song = {
  id: string;
  artists: Array<{ name: string }>;
  name: string;
};

type Bracket = Array<{
  matchRound: number;
  matchComponent: React.JSX.Element;
  matchWinnerId: string | null;
}>;

type initializeBracketProps = {
  players: Array<Song>;
  handleClick: (arg0: number, arg1: string) => void;
};

function initializeBracket({ players, handleClick }: initializeBracketProps): Bracket {
  const bracket = [];
  let matchIndex = 0;

  //push first round into matches
  for (let i = 0; i < players.length; i += 2) {
    const match = {
      matchRound: 1,
      matchComponent: (
        <Match
          matchId={matchIndex++}
          trackOne={players[i]}
          trackTwo={players[i + 1]}
          handleClick={handleClick}
        />
      ),
      matchWinnerId: null,
    };
    bracket.push(match);
  }

  return bracket;
}

type MatchPageProps = {
  players: Array<Song>;
};

function MatchPage({ players }: MatchPageProps): React.JSX.Element {
  const [currMatchId, setCurrMatchId] = useState(0); //has to be in state -> will cause the rerenders

  const bracketRef = useRef(initializeBracket({ players, handleClick }));
  const nextMatchIdRef = useRef(bracketRef.current.length);

  function advanceMatchExists(): boolean {
    return bracketRef.current[nextMatchIdRef.current] !== undefined;
  }

  function advanceMatchIsSet(): boolean {
    return bracketRef.current[nextMatchIdRef.current].matchComponent.props.trackTwo !== null;
  }

  function addNextMatch(newBracket: Bracket, matchId: number, winnerId: string): Bracket {
    if (!advanceMatchExists() || advanceMatchIsSet()) {
      //add new match to bracket
      newBracket.push({
        matchRound: bracketRef.current[matchId].matchRound + 1,
        matchComponent: (
          <Match
            matchId={nextMatchIdRef.current}
            trackOne={
              winnerId === bracketRef.current[matchId].matchComponent.props.trackOne.id
                ? bracketRef.current[matchId].matchComponent.props.trackOne
                : bracketRef.current[matchId].matchComponent.props.trackTwo
            }
            trackTwo={null}
            handleClick={handleClick}
          />
        ),
        matchWinnerId: null,
      });

      if (advanceMatchExists() && advanceMatchIsSet()) nextMatchIdRef.current++;
    }
    //advance match is not set
    else {
      newBracket[nextMatchIdRef.current].matchComponent = (
        <Match
          matchId={nextMatchIdRef.current}
          trackOne={bracketRef.current[nextMatchIdRef.current].matchComponent.props.trackOne}
          trackTwo={
            winnerId === bracketRef.current[matchId].matchComponent.props.trackOne.id
              ? bracketRef.current[matchId].matchComponent.props.trackOne
              : bracketRef.current[matchId].matchComponent.props.trackTwo
          }
          handleClick={handleClick}
        />
      );
    }

    return newBracket;
  }

  function handleClick(matchId: number, winnerId: string): void {
    let newBracket = bracketRef.current.map((m, i) => {
      if (i === matchId)
        return {
          ...m,
          matchWinnerId: winnerId,
        };
      else return m;
    });

    newBracket = addNextMatch(newBracket, matchId, winnerId);

    bracketRef.current = newBracket;
    setCurrMatchId((prev) => prev + 1);
  }

  return (
    <>
      {currMatchId !== players.length - 1 ? (
        <div id="match-display">
          <h1 className="round-display">
            {"Round of " +
              players.length / Math.pow(2, bracketRef.current[currMatchId].matchRound - 1)}
          </h1>
          {bracketRef.current[currMatchId].matchComponent}
        </div>
      ) : (
        <VictoryPage bracket={bracketRef.current} />
      )}
    </>
  );
}

export default MatchPage;
