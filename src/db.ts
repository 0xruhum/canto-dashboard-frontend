import { Pool } from 'pg';

export class DB {
    private pool: Pool;
    constructor() {
        this.pool = new Pool({
            user: process.env.PGSQL_USER,
            password: process.env.PGSQL_PASSWORD,
            host: process.env.PGSQL_HOST,
            port: process.env.PGSQL_PORT as unknown as number, // weird hack. can I do this cleaner?
            database: process.env.PGSQL_DATABASE,
        });
    }

    async getTxCountByDayLastMonth(): Promise<TxsPerDay[]> {
        const query = `
            SELECT timestamp::date as ts, COUNT(*) AS tx_count
            FROM txs
            WHERE timestamp > now() - interval '30 day'
            GROUP BY timestamp::date
            ORDER BY timestamp::date ASC;
        `;

        const result = await this.pool.query(query);
        return result.rows as TxsPerDay[];
    }

    async getUsersPerDayLastMonth(): Promise<UsersPerDay[]> {
        // can I make this faster my moving the DISTINCT call?
        // see https://stackoverflow.com/questions/11250253/postgresql-countdistinct-very-slow
        const query = `
            SELECT timestamp::date AS ts, count(DISTINCT sender)
            FROM txs
            WHERE timestamp > now() - interval '30 day'
            GROUP BY ts
            ORDER BY ts ASC;
        `;

        const result = await this.pool.query(query);
        return result.rows as UsersPerDay[];
    }

    // returns the 10 contracts that used up most gas in the last 30 days
    async getTopGasGuzzlersLastMonth(): Promise<GasUsage[]> {
        const query = `
            SELECT sum(txs.gasused) as gas_used, txs.recipient as contract 
            FROM txs
            JOIN blocks ON txs.hash = ANY (blocks.tx_hashes)
            WHERE iscontract = true
            AND timestamp > now() - interval '30 day'
            GROUP BY contract
            ORDER BY gas_used DESC
            LIMIT 10;
        `;

        const result = await this.pool.query(query);
        return result.rows as GasUsage[];
    }

    // returns the base fee spent on txs for the top ten contracts
    async getBaseFeeSpentOnContractsLastMonth(): Promise<> {
        const query = `
            SELECT sum(txs.gasused * blocks.basefee), txs.recipient as contract
            FROM txs
            JOIN blocks on txs.hash = ANY (blocks.tx_hashes)
            WHERE contract = ANY (SELECT ) as 
        `;
    }

    async getTotalGasUsageLastMonth(): Promise<number> {
        const query = `
            SELECT sum(gasused) as gasused
            FROM txs
            WHERE timestamp > now() - interval '30 day'
        `;

        const result = await this.pool.query(query);
        return result.rows[0].gasused as number;
    }
}

export interface GasUsage {
    contract: string;
    gas_used: number;
}
export interface TxsPerDay {
    ts: Date;
    tx_count: number;
}

export interface UsersPerDay {
    ts: Date;
    count: number;
}