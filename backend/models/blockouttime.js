'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BlockOutTime extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  BlockOutTime.init({
    start_time: DataTypes.DATE,
    end_time: DataTypes.DATE,
    reason: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'BlockOutTime',
  });
  return BlockOutTime;
};