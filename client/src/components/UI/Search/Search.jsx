import React, { useState } from 'react'
import styles from "./Search.module.scss";
import SearchResults from '../SearchResults/SearchResults';

// Search Bar component receives a placeholder prop for the search default message
const Search = ({ placeholder }) => {
  const [searchValue, setSearchValue] = useState("");
  const [timer, setTimer] = useState(null);
  let searchOutput;

  //Logic for waiting until a user is done typing to query the Finnhub API
  const inputChanged = e => {
    setSearchValue(e.target.value);
    clearTimeout(timer);

    const newTimer = setTimeout(() => {
      searchOutput = <SearchResults searchValue={searchValue} />
      console.log(searchOutput);
    }, 500); //0.5 second wait after a user stops typing
    setTimer(newTimer);
  };

  return (
    <>
      <div className={styles.container}>
        <input className={styles.search} type="text" placeholder={placeholder} onChange={inputChanged}/>
      </div>

      { searchValue ==="" ?
        <></> : 
        <></>
      }

    </>
  );
};

export default Search;
