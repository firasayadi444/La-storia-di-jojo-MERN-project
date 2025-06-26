const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { readdirSync } = require("fs");
const connectDatabase = require("./utils/database");
const app = express();

require("dotenv").config();

connectDatabase();

app.use(bodyParser.json());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://192.168.100.96:8080',
    'http://192.168.100.96:8081',
    'http://192.168.100.96:8082',
    'http://192.168.245.1:8080',
    'http://192.168.245.1:8081',
    'http://192.168.245.1:8082',
    'http://192.168.119.1:8080',
    'http://192.168.119.1:8081',
    'http://192.168.119.1:8082'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

readdirSync("./routes").map((r) => {
  app.use("/api", require(`./routes/${r}`));
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
