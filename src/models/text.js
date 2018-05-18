const loader = require('./sequelizeLoader');
const Sequelize = loader.Sequelize;

const text = loader.database.define(
  'texts',
  {
    textId: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    text: {
      type: Sequelize.TEXT
    }
  },
  {
    freezeTableName: false,
    timestamps: true,
    indexes: [
      {
        fields: ['textId']
      }
    ]
  }
);

module.exports = text;