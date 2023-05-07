import { GetServerSideProps } from 'next';
import { Inter } from 'next/font/google';

// import Chart from 'chart.js/auto'
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, ChartOptions, Title } from 'chart.js';
import { Line } from 'react-chartjs-2';
import dayjs from "dayjs";

import { DB, GasUsage } from "../db";

const inter = Inter({ subsets: ['latin'] })

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Title);

interface Props {
  // all three of these arrays have the same length
  days: string[];
  txs: number[];
  users: number[];
  gasGuzzlers: GasUsage[];
  totalGasUsage: number;
}

export default function Home({ days, txs, users, gasGuzzlers, totalGasUsage }: Props) {
  const chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    parsing: {
      xAxisKey: "timestamp",
      yAxisKey: "tx_count",
    },
    borderColor: "rgb(6, 252, 153)",
    backgroundColor: "rgb(0, 0, 0)",
  };
  return (
    <main>
      <title>The Canto Dashboard</title>
      <p className={"flex justify-center pt-12 text-3xl"}>The Canto Dashboard</p>
      <div className={`grid grid-cols-2 p-24 gap-2`}>
        {/* txs per day/month */}
        <div className={"w-full"}>
          <Line
            data={{
              labels: days,
              datasets: [
                {
                  label: "txs",
                  data: txs,
                },
              ]
            }}
            options={{
              ...chartOptions,
              plugins: {
                title: {
                  display: true,
                  text: "number of transactions in the last 30 days",
                },
              },
            }}
          />
        </div>
        {/* daily users */}
        <div className={"w-full"}>
          <Line
            data={{
              labels: days,
              datasets: [
                {
                  label: "users",
                  data: users,
                },
              ]
            }}
            options={{
              ...chartOptions,
              plugins: {
                title: {
                  display: true,
                  text: "number of unique users in the last 30 days",
                },
              },
            }}
          />
        </div>
      </div>
      <p className={"flex justify-center text-white"}>Top Gas Guzzlers in the last month</p>
      <div className="flex justify-center">
        <table className="table-auto border-spacing-2 border-separate">
          <thead>
            <tr>
              <th>Contract</th>
              <th>Gas Used</th>
            </tr>
          </thead>
          <tbody>
            {gasGuzzlers.map((ele) => <tr><td><a target="_blank" href={`https://tuber.build/address/${ele.contract}`}>{ele.contract}</a></td><td>{`${(ele.gas_used / totalGasUsage * 100).toFixed(2)}%`}</td></tr>)}
          </tbody>
        </table>
      </div>
      <p className='flex justify-center p-24 text-white'>Stats are updated every hour. Oldest block included: 2537250</p>
    </main>
  )
}
export const getServerSideProps: GetServerSideProps = async (context) => {
  const db = new DB();
  const [txsPerDay, usersPerDay, gasGuzzlers, totalGasUsage] = await Promise.all([
    db.getTxCountByDayLastMonth(),
    db.getUsersPerDayLastMonth(),
    db.getTopGasGuzzlersLastMonth(),
    db.getTotalGasUsageLastMonth(),
  ]);

  const days = txsPerDay.map((ele) => dayjs(ele.ts.toISOString()).format("DD/MM/YYYY"));
  return {
    props: {
      gasGuzzlers,
      totalGasUsage,
      days,
      txs: txsPerDay.map((ele) => ele.tx_count),
      users: usersPerDay.map((ele) => ele.count),
    },
  };
};
