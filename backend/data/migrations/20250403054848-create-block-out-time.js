'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BlockOutTimes', { // Plural name
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      start_time: { // Specific date and time
        type: Sequelize.DATE,
        allowNull: false
      },
      end_time: { // Specific date and time
        type: Sequelize.DATE,
        allowNull: false
      },
      reason: { // Optional reason (e.g., Holiday, Meeting)
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    // Add index for querying by time range
     await queryInterface.addIndex('BlockOutTimes', ['start_time', 'end_time']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('BlockOutTimes');
  }
};
