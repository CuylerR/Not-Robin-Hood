import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styles from "./Asset.module.scss";
import assetUp from "../../../assets/icons/asset-up.svg";
import assetDown from "../../../assets/icons/assetsdown.svg";
import { useGetPortfolioStocksQuery } from "../../../redux/slices/user/userApiSlice";
import { selectCurrentUser } from "../../../redux/slices/auth/authSlice";
import Loading from "../Loading/Loading";
// Dark Mode
import { selectDarkMode } from "./../../../redux/slices/darkModeSlice";
import { useDispatch } from "react-redux";
import { setGraphData } from "../../../redux/slices/graphDataSlice";
import { selectGraphFilterRange } from "../../../redux/slices/graphFilterRangeSlice";

const Asset = () => {
  // Dark Mode Theme
  const darkModeTheme = useSelector(selectDarkMode);
  // When Settings page is rendered, we will set our localstorage "darkMode": false by default;
  useEffect(() => {
    localStorage.setItem("darkMode", darkModeTheme);
  }, [darkModeTheme]);
  // End Dark Mode Theme

  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const { data: stocksData } = useGetPortfolioStocksQuery(currentUser);
  const [assetValue, setAssetValue] = useState(0);
  const [dailyPercentageChange, setDailyPercentageChange] = useState(0);
  const [dailyAssetValueChange, setDailyAssetValueChange] = useState(0);
  let sumArray = [];

  //Function to remove duplicate stock names from portfolio and only show unique list of stocks
  //Returns array of objects of all unique stock tickers, name, and number of shares owned by user
  const uniqueStocks = () => {
    if (stocksData) {
      const uniqueStocksArray = [];
      stocksData.forEach((stock) => {
        const found = uniqueStocksArray.find(
          (item) => item.name === stock.name
        );
        if (!found) {
          uniqueStocksArray.push({
            name: stock.name,
            symbol: stock.symbol,
            shares: stock.share,
          });
        }
      });
      return uniqueStocksArray;
    }
  };

  //Async function to list all user owned stock symbols in an array
  const stockSymbolArray = async () => {
    const result = await Promise.all(
      stocksData.map(async (stock) => {
        return stock.symbol;
      })
    );
    return result;
  };

  //Async function to list number of shares per stock of all user owned stock in an array
  const numSharesArray = async () => {
    const result = await Promise.all(
      stocksData.map(async (stock) => {
        return stock.share;
      })
    );

    return result;
  };

  //Historical data function to get amount of all owned stock from portfolio
  //and return an array of total closing costs across set number of days
  //For example if 7 days of historical data is wanted, it would return an array
  //of the sum of all closing prices for each day
  const historicalData = async (symbols, numDays) => {
    const results = [];

    for (const symbol of symbols) {
      const response = await fetch(
        `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&count=${numDays}&token=${process.env.REACT_APP_FINNHUB_API_KEY}`
      );
      const data = await response.json();

      results.push(data);
    }

    return results;
  };

  const numDays = useSelector(selectGraphFilterRange); //Set number of days for graph range as well as how far back you want historic finnhub data. Doesn't include weekends.
  const [symbols, setSymbols] = useState(); //Array of stock symbols
  const [numShares, setNumShares] = useState(); //Array of number of shares of each stock
  let dates = []; //Array of dates based on numDays variable

  //useEffect hook to update symbols and number of shares at startup
  useEffect(() => {
    const fetchSymbolsAndShares = async () => {
      const symbolsResult = await stockSymbolArray();
      const numSharesResult = await numSharesArray();
      setSymbols(symbolsResult);
      setNumShares(numSharesResult);
    };

    if (stocksData) {
      fetchSymbolsAndShares();
    }

    // Update graphData state with the dates and sumArray data
    dispatch(
      setGraphData({
        labels: dates,
        datasets: [
          {
            // label: "$",
            data: sumArray,
          },
        ],
      })
    );
  }, [stocksData, numDays]);

  const temp = useSelector((state) => state.graphData);

  //Wait unitl symbols and numShares async is done, then grab all historic data for graph
  //as well as calculate change Daily change in Asset Value
  useEffect(() => {
    //Wait Until Symbols and numShares exist
    if (symbols && numShares) {
      const datesUnix = generateDatesArray(numDays);

      historicalData(symbols, numDays+100).then((results) => {
        console.log(`Finnhub API Closing Results`, results);
        //Generate an array of dates Fill sumArray with 0's based on length
        //of closing costs
        if (results.length !== 0) {
          dates = convertUnixToReadableDates(datesUnix);
          sumArray = Array.from({ length: dates.length }, () => 0);
          
          // console.log('ALERT: ', sumArray);
          // console.log("Dates in Unix format", datesUnix);
          // console.log("Dates in readable format", dates);
        }

        //For each of the stocks the user owns, step through each day and sum the (shares owned * daily closing price)
        // results.forEach((finnhubResult, stockPosition) => {
        //   // Find the starting position in finnhubResult.t that matches the first date in dates array
        //   let startPosition = finnhubResult.t.findIndex(time => time === datesUnix[0]);
        //   console.log("Dates[0] ",datesUnix[0]);
        //   console.log("Start position ",startPosition);
        
        //   // If startPosition doesn't exist, find the nearest oldest date in dates array
        //   if (startPosition === -1) {
        //     const reverseFinnhubDates = finnhubResult.t.slice().reverse();
        //     let nearestDate = reverseFinnhubDates.find(date => date <= datesUnix[0]);
        //     console.log("Nearest Date ", nearestDate);

        //     // If a nearest date is found, set the startPosition accordingly
        //     if (nearestDate) {
        //       startPosition = finnhubResult.t.findIndex(time => time === nearestDate);
        //       console.log("Start position w/ nearest date ",startPosition);
        //     }
        //   }
        
        //   // If startPosition exists, calculate the sumArray
        //   if (startPosition !== -1) {
        //     finnhubResult.c?.slice(startPosition).forEach((value, index) => {
        //       let currentDate = finnhubResult.t[startPosition + index];
        //       let nextDate = datesUnix[index + 1];
        
        //       // Check if the next finnhubResult.t matches the next date in the dates array
        //       if (nextDate && currentDate === nextDate) {
        //         // If they match, add the value multiplied by the number of shares to the sumArray
        //         sumArray[index] += value * numShares[stockPosition];
        //       } else {
        //         // If they don't match, find the nearest oldest date in the dates array
        //         const reverseFinnhubDates = finnhubResult.t.slice().reverse();
        //         let nearestDate = reverseFinnhubDates.find(date => date <= datesUnix[0]);
        //         startPosition = finnhubResult.t.findIndex(time => time === nearestDate);
        
        //         // If a nearest date is found, update the startPosition and add the value multiplied by the number of shares to the sumArray
        //         if (nearestDate) {
        //           startPosition = finnhubResult.t.findIndex(time => time === nearestDate);
        //           sumArray[index] += value * numShares[stockPosition];
        //           console.log("Start position w/ nearest date (Second Time) ",startPosition);
        //           console.log("Sum Array: ", sumArray);
        //           console.log("Current Value: ", value);
        //           console.log("Number of Shares: ", numShares[stockPosition]);
        //         }
        //       }
        //     });
        //   }
        // });

        // console.log("Sum", sumArray);
        // console.log("Dates", dates);

        // Update graphData state with the dates and sumArray data
        dispatch(
          setGraphData({
            labels: dates,
            datasets: [
              {
                // label: "$",
                data: sumArray,
              },
            ],
          })
        );

        // console.log(temp);

        const lengthOfSumArray = sumArray.length;
        if (lengthOfSumArray >= 2) {
          setDailyAssetValueChange(
            (
              sumArray[lengthOfSumArray - 1] - sumArray[lengthOfSumArray - 2]
            ).toFixed(2)
          );
          setDailyPercentageChange(
            (
              ((sumArray[lengthOfSumArray - 1] -
                sumArray[lengthOfSumArray - 2]) /
                sumArray[lengthOfSumArray - 2]) *
              100
            ).toFixed(2)
          );
        } else {
          setDailyAssetValueChange(0);
          setDailyPercentageChange(0);
        }

        setAssetValue(stocksData?.reduce((acc, curr) => acc + curr.equity, 0));

        // console.log("Asset Value Change", dailyAssetValueChange);
        // console.log("Percent Change", dailyPercentageChange);

        // console.log("Length", lengthOfSumArray, sumArray);
      });
    }
  }, [symbols, numShares]);

  //Function to generate an array of dates based on the number of days
  //This accounts for the timezone of the user and the graph won't display the next date until it turns midnight for the user
  const generateDatesArray = (numDays) => {
    const dates = []; //Create an array to store all dates in the range of numDays
    
    const today = new Date(); //Grab today's date based on user's local timezone
    today.setHours(0, 0, 0, 0); //Set the time to 00:00:00 midnight

    const options = { year: 'numeric', month: 'short', day: '2-digit'}; //Set the date format to "Jul 03, 2023"
    const dateString = today.toLocaleString('en-US', options); //Create a string of the date in the format above
    const specificDate = new Date(dateString + " 00:00:00 GMT+0000");//Create a new date object based on the date string above, but set the timezone to GMT +0000

    const gmtDate = specificDate.toGMTString(); // Get the GMT +0000 date string
    console.log('Todays Date in UTC+0000: ', gmtDate);


    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(specificDate); // Create a new date object based on the specificDate
      date.setDate(date.getDate() - i); // Subtract the number of days from the specificDate
      
      const unixTimestamp = Math.floor(date.getTime() / 1000); // Convert the date to Unix Timestamp (seconds)
      dates.push(unixTimestamp); // Add the formatted date to the dates array
    }

    return dates;
  }

  //Function used to convert UNIX Timestamps to readable dates
  const convertUnixToReadableDates = (timestamps) => {
    const dates = [];
    timestamps.forEach((timestamp) => {
      const date = new Date(timestamp * 1000);
      const month = date.getUTCMonth() + 1;
      const day = date.getUTCDate();
      const year = date.getUTCFullYear();
      const formattedDate = `${month < 10 ? "0" : ""}${month}-${
        day < 10 ? "0" : ""
      }${day}-${year}`;
      dates.push(formattedDate);
    });
    return dates;
  }

  const condition = dailyAssetValueChange >= 0 ? "positive" : "negative";

  if (!stocksData) {
    return <Loading />;
  }

  return (
    <div
      className={`${styles.container} ${
        darkModeTheme ? styles["dark-mode"] : ""
      }`}
    >
      <h3 className={styles.title}>Asset Value</h3>
      {stocksData ? (
        <>
          <p className={styles.amount}>${assetValue.toFixed(2)}</p>
          <div
            className={styles.results}
            style={{
              color: condition === "positive" ? "#2ab795" : "#AE2424",
            }}
          >
            {condition === "positive" ? (
              <img src={assetUp} alt="up" />
            ) : (
              <img src={assetDown} alt="down" />
            )}
            {/* {`$${dailyAssetValueChange} (${dailyPercentageChange}%)`} */}
            {dailyAssetValueChange >= 0
              ? `+$${dailyAssetValueChange} (+${dailyPercentageChange}%)`
              : `-$${dailyAssetValueChange
                  .toString()
                  .slice(1)} ( -${dailyPercentageChange
                  .toString()
                  .slice(1)}% )`}
            <span>Today</span>
          </div>
        </>
      ) : (
        <h2 style={{ textAlign: "center", margin: "2rem" }}>
          Not Available...
        </h2>
      )}
    </div>
  );
};

export default Asset;
