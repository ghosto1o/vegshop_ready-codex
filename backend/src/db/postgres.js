import pg from 'pg'

const { Client } = pg

const postgres = new Client({ connectionString: process.env.POSTGRES_URI })

export default postgres
