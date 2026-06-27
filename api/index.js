// This file acts as the entry point for Vercel Serverless Functions
// It maps the serverless environment directly to our existing Express application

const app = require('../server/index.js');
module.exports = app;
