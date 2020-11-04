import './App.css';
import React, { useEffect } from 'react';
import { Bar, ChartData, Line } from 'react-chartjs-2';
import { Chart } from 'chart.js';

const createRandomFollowersData = () => {
  const maxDate = new Date();
  const minDate = new Date(maxDate.valueOf() - 5 * 365 * 24 * 60 * 60 * 1000);
  const dataPoints = Array.from({ length: 500 }).map(() => ({
    timestamp: new Date(
      Math.floor(Math.random() * (maxDate.valueOf() - minDate.valueOf())) +
        minDate.valueOf()
    ).toISOString(),
    followers: Math.floor(Math.random() * 1000000) + 0,
  }));
  return dataPoints.sort(
    (a, b) => new Date(a.timestamp).valueOf() - new Date(b.timestamp).valueOf()
  );
};

const createRandomAssetData = () => {
  const maxDate = new Date();
  const minDate = new Date(maxDate.valueOf() - 5 * 365 * 24 * 60 * 60 * 1000);
  const dataPoints = Array.from({ length: 500 }).map(() => ({
    timestamp: new Date(
      Math.floor(Math.random() * (maxDate.valueOf() - minDate.valueOf())) +
        minDate.valueOf()
    ).toISOString(),
    price: Math.floor(Math.random() * 45) + 1,
  }));
  return dataPoints.sort(
    (a, b) => new Date(a.timestamp).valueOf() - new Date(b.timestamp).valueOf()
  );
};

const followersData = createRandomFollowersData();

const yAxisFollowers = {
  type: 'linear',
  id: 'followers',
};

const yAxisDelta = {
  type: 'linear',
  position: 'right',
  id: 'change',
};

const yAxisRank = {
  type: 'linear',
  id: 'rank',
  ticks: {
    reverse: true,
  },
};

const yAxisAssets = {
  type: 'linear',
  position: 'right',
  id: 'assets',
};

const selectChartAxes = (
  containsFollowers: boolean,
  containsRank: boolean,
  showDelta: boolean,
  showAssets: boolean
) => {
  const yAxes = [];
  if (containsFollowers) yAxes.push(yAxisFollowers);
  if (containsRank) yAxes.push(yAxisRank);
  if (showDelta) yAxes.push(yAxisDelta);
  if (showAssets) yAxes.push(yAxisAssets);
  return yAxes;
};

const decimateChart = (
  data: {
    t: Date;
    y: number;
  }[],
  numBuckets: number,
  startDate?: Date,
  endDate?: Date
) => {
  if (!startDate) {
    startDate = data[0].t;
  }
  if (!endDate) {
    endDate = data[data.length - 1].t;
  }

  // create evenly spaced dates
  const dt = endDate.valueOf() - startDate.valueOf();
  const startValue = startDate.valueOf();
  const spacedDates = Array.from({ length: numBuckets + 1 }).map((_, idx) => {
    return new Date(startValue + (idx * dt) / numBuckets);
  });

  // make buckets
  const buckets = Array.from({ length: numBuckets + 2 }).map(() => []) as {
    t: Date;
    y: number;
  }[][];
  const filteredData = data.filter(
    (e) => e.t >= spacedDates[0] && e.t <= spacedDates[spacedDates.length - 1]
  );

  // place data into buckets
  let jdx = 0;
  spacedDates.forEach((e, idx) => {
    for (; jdx < filteredData.length; ) {
      const e = filteredData[jdx];
      const date = new Date(e.t);
      if (date >= spacedDates[idx] && date <= spacedDates[idx + 1]) {
        buckets[idx].push({
          t: date,
          y: e.y,
        });
        ++jdx;
      } else break;
    }
  });

  // one plot per bucket
  return buckets.map((bucket, idx) => {
    const date = spacedDates[idx];
    if (bucket.length === 0) {
      return {
        t: date,
        y: NaN,
      };
    }
    return bucket[bucket.length - 1];
  });
};

const chartMappedFollowersData = followersData.map((followerData) => ({
  t: new Date(followerData.timestamp),
  y: followerData.followers,
}));

// const decimatedData = decimateChart(chartMappedFollowersData, 75);
const decimatedData = decimateChart(chartMappedFollowersData, 75).map(
  (e, idx) => {
    if (idx > 1 && idx < 10) {
      return {
        t: e.t,
        y: NaN,
      };
    }
    if (idx > 30 && idx < 45) {
      return {
        t: e.t,
        y: NaN,
      };
    }
    return e;
  }
);

const decimatedDataToBars = (
  data: {
    t: Date;
    y: number;
  }[]
) => {
  if (data.length < 2) {
    return [
      {
        t: data[0].t,
        y: data[0].y,
      },
    ];
  }
  const bars = [];
  const indexedData = data.map((e, idx) => ({
    ...e,
    idx,
  }));

  const filteredIndexedData = indexedData.filter((e) => !isNaN(e.y));
  for (let idx = 0; idx < filteredIndexedData.length - 1; ++idx) {
    const dt = data[idx + 1].t.valueOf() - data[idx].t.valueOf();
    for (
      let idy = 0;
      idy < filteredIndexedData[idx + 1].idx - filteredIndexedData[idx].idx;
      ++idy
    ) {
      const t = new Date(filteredIndexedData[idx].t.valueOf() + idy * dt);
      const deltaY =
        (filteredIndexedData[idx + 1].y - filteredIndexedData[idx].y) /
        (filteredIndexedData[idx + 1].idx - filteredIndexedData[idx].idx);
      bars.push({
        t,
        y: deltaY,
      });
    }
  }
  return bars;
};

const formatter = Intl.DateTimeFormat('en');
const chartOptionsLinear = {
  scales: {
    yAxes: selectChartAxes(true, false, true, true),
    xAxes: [
      {
        type: 'time' as "time",
        time: {
          unit: 'day' as "day",
          displayFormats: { day: 'MMM DD, Y' },
          min: formatter.format(chartMappedFollowersData[0].t),
          max: formatter.format(
            chartMappedFollowersData[chartMappedFollowersData.length - 1].t
          ),
        },
        ticks: {
          source: 'labels' as "labels",
        },
      },
    ],
    maintainAspectRatio: false,
  },
};

const chartData = {
  labels: decimatedData.map((e) => e.t).filter((_, idx) => idx % 3 === 0),
  datasets: [
    {
      yAxisID: 'followers',
      backgroundColor: 'rgb(54, 162, 235)',
      borderColor: 'rgb(88, 88, 88)',
      fill: false,
      type: 'line',
      label: 'followers',
      spanGaps: true,
      data: decimatedData,
    },
    {
      fill: false,
      yAxisID: 'change',
      type: 'bar',
      backgroundColor: 'rgb(235, 54, 162)',
      label: 'followers change',
      data: decimatedDataToBars(
        chartMappedFollowersData//.filter((_, idx) => idx > 40 && idx < 60)
      ),
      barThickness: 10
    },
  ],
};

function App(): JSX.Element {
  // useEffect(() => {
  //   new Chart('chart0', {
  //     type: 'bar',
  //     data: chartData,
  //     //@ts-ignore
  //     options: chartOptionsLinear,
  //   });
  // }, []);

  return (
    <div style={{ margin: '1em' }}>
      <Bar data={chartData} options={chartOptionsLinear} />
    </div>
  );
}

export default App;
