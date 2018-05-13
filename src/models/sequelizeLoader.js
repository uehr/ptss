'use strict';
const Sequelize = require('sequelize');
const sequelize = new Sequelize("hoge", "postgres", 1357, {
  host: "localhost",
  dialect: "postgres"
})

module.exports = {
  database: sequelize,
  Sequelize: Sequelize
};