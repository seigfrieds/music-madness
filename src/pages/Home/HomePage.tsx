import React, { useState, FormEvent, ChangeEvent, ReactElement } from "react";
import type { Song } from "../../types";
import MatchPage from "../Tournament/TournamentPage";
import BracketParameterForm from "./components/BracketParameterForm";
import axios from "axios";

type Props = {
  token: string;
};

//durstenfeld shuffle: https://stackoverflow.com/a/12646864
function shuffleArray(array: Array<any>): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export default function HomePage({ token }: Props): React.JSX.Element {
  const [tracks, setTracks] = useState<null | Array<Song>>(null);
  const [queryType, setQueryType] = useState(""); //top_tracks, playlist

  const [error, setError] = useState<null | ReactElement>(null);

  //global
  const [numTracks, setNumTracks] = useState(8);

  //top tracks params
  const [timeFrame, setTimeFrame] = useState("short_term");

  //playlist params
  const [playlistLink, setPlaylistLink] = useState("");

  async function getTracks(token: string): Promise<void> {
    if (queryType === "top_tracks") {
      const request = await axios.get("https://api.spotify.com/v1/me/top/tracks", {
        headers: {
          Authorization: "Bearer " + token,
        },
        params: {
          limit: numTracks,
          time_range: timeFrame,
        },
      });

      shuffleArray(request.data.items);

      setTracks(request.data.items);
    } else if (queryType === "playlist") {
      const PLAYLIST_ID = playlistLink.split("/playlist/")[1].split("?si=")[0];

      //total # of tracks in the playlist
      let totalTracksInPlaylist = 0;

      //spotify playlists have id's of length 22 -> enforce this check to reduce API spam
      if (PLAYLIST_ID.length === 22) {
        //get playlist (Defaults to first 100 tracks)
        const request = await axios.get("https://api.spotify.com/v1/playlists/" + PLAYLIST_ID, {
          headers: {
            Authorization: "Bearer " + token,
          },
          params: {
            fields: "tracks",
          },
        });

        totalTracksInPlaylist = request.data.tracks.total;
      }

      //if # of tracks in playlist does not accomodate chosen bracket size
      if (totalTracksInPlaylist < numTracks) {
        setError(<p id="error">Error! Not enough tracks in playlist</p>);
      } else {
        //calculate # of sections with 100 songs in playlist (e.g. songs 1-99, songs 300-399)
        const NUM_OF_100_SONG_SECTIONS_IN_PLAYLIST = Math.ceil(totalTracksInPlaylist / 100);

        //pick random 100 song section in playlist
        let selectedSectionNum = Math.floor(Math.random() * NUM_OF_100_SONG_SECTIONS_IN_PLAYLIST);
        //while randomly selected section cannot accomodate bracket
        while (totalTracksInPlaylist - selectedSectionNum * 100 < numTracks)
          selectedSectionNum = Math.floor(Math.random() * NUM_OF_100_SONG_SECTIONS_IN_PLAYLIST);

        //get random 100 song section in playlist from api
        const selectedSection = await axios.get(
          "https://api.spotify.com/v1/playlists/" +
            PLAYLIST_ID +
            "/tracks?offset=" +
            selectedSectionNum * 100 +
            "&limit=100&locale=en-US,en;q=0.9",
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          },
        );

        /* get tracks! */
        shuffleArray(selectedSection.data.items);

        const chosenPlaylistTracks = [];
        for (let i = 0; i < numTracks; i++)
          chosenPlaylistTracks[i] = selectedSection.data.items[i].track;

        setTracks(chosenPlaylistTracks);
      }
    }
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();

    getTracks(token);
  }

  function handlePlaylistLinkChange(event: ChangeEvent<HTMLInputElement>): void {
    console.log(playlistLink);
    setPlaylistLink(event.target.value);
  }

  function handleQueryTypeChange(event: ChangeEvent<HTMLSelectElement>): void {
    setQueryType(event.target.value);
  }

  function handleNumTracksChange(event: ChangeEvent<HTMLSelectElement>): void {
    setNumTracks(Number(event.target.value));
  }

  function handleTimeFrameChange(event: ChangeEvent<HTMLSelectElement>): void {
    setTimeFrame(event.target.value);
  }

  return (
    <>
      {tracks === null ? (
        <>
          <BracketParameterForm
            handleSubmit={handleSubmit}
            handleQueryTypeChange={handleQueryTypeChange}
            handleNumTracksChange={handleNumTracksChange}
            handleTimeFrameChange={handleTimeFrameChange}
            handlePlaylistLinkChange={handlePlaylistLinkChange}
          />
          {error !== null && error}
          {console.log("Waiting for API...")}
        </>
      ) : (
        <MatchPage players={tracks} />
      )}
    </>
  );
}