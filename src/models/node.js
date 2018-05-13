const loader = require('./sequelizeLoader');
const Sequelize = loader.Sequelize;

// - IPアドレス
// - ポート番号
// - アップロード速度
// - クラスタリングキーワード3つ

const node = loader.database.define(
  'nodes',
  {
    nodeId: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    IP: {
      type: Sequelize.STRING,
      allowNull: false
    },
    clusterKeys: {
      type: Sequelize.ARRAY(Sequelize.STRING)
    }
  },
  {
    freezeTableName: false,
    timestamps: true,
    indexes: [
      {
        fields: ['nodeId']
      }
    ]
  }
);

module.exports = node;