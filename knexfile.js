require('dotenv').config();
module.exports = {

  development: {
    client: 'pg',
    connection: {
      host: process.env.POSTGRES_HOST,
      password: process.env.POSTGRES_PASSWORD,
      user:     process.env.POSTGRES_USER,
      database: process.env.POSTGRES_DB,
      port: process.env.POSTGRES_PORT
      
    },
    migrations: {
      directory: './src/database/migrations'
    }
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.POSTGRES_HOST,
      password: process.env.POSTGRES_PASSWORD,
      user:     process.env.POSTGRES_USER,
      database: process.env.POSTGRES_DB,
      port: process.env.POSTGRES_PORT
      
    },
    migrations: {
      directory: './src/database/migrations'
    }
  }

};