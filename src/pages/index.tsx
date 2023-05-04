import { GetServerSideProps } from 'next';
import { Inter } from 'next/font/google';

// import Chart from 'chart.js/auto'
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';
import dayjs from "dayjs";

import { DB, TxsPerDay, UsersPerDay } from "../db";

const inter = Inter({ subsets: ['latin'] })

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

interface Props {
  // all three of these arrays have the same length
  days: string[];
  txs: number[];
  users: number[];
}

export default function Home({ days, txs, users }: Props) {
  const chartOptions: ChartOptions = {
    maintainAspectRatio: true,
    parsing: {
      xAxisKey: "timestamp",
      yAxisKey: "tx_count",
    },
    borderColor: "rgb(6, 252, 153)",
    backgroundColor: "rgb(0, 0, 0",
  };
  return (
    <main>
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
            options={chartOptions}
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
            options={chartOptions}
        />
        </div>
      </div>
      <p className='flex justify-center p-24 text-white'>Stats are updated every hour. Oldest block included: 2537250</p>
    </main>
  )
}
export const getServerSideProps: GetServerSideProps = async (context) => {
  const db = new DB();
  // got to convert the timestamp into a day
  const txsPerDay = await db.getTxCountByDayLastMonth();
  const days = txsPerDay.map((ele) => dayjs(ele.ts.toISOString()).format("DD/MM/YYYY"));

  const usersPerDay = await db.getUsersPerDayLastMonth();

  return {
    props: {
      // can't just return `txsPerDay` because it can't serialize the Date type.
      // see https://stackoverflow.com/questions/70449092/reason-object-object-date-cannot-be-serialized-as-json-please-only-ret
      days,
      txs: txsPerDay.map((ele) => ele.tx_count),
      users: usersPerDay.map((ele) => ele.count),
    },
  };
};
