import React from "react";
import styles from "./Graph.module.scss";
import { Chart as ChartJS } from "chart.js/auto";
import { Line } from "react-chartjs-2";

// Graph component
const Graph = ({ chartData }) => {

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "GAINS!"
      },
      legend: {
        display: false
      }
    }
  };


  return (
    <div className={styles.container}>
      <Line
        data={chartData}
        options={options}
      />
    </div>
  );
};

export default Graph;
