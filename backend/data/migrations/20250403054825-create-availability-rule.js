'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AvailabilityRules', { // Plural name
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      day_of_week: { // 0=Sunday, 1=Monday... 6=Saturday
        type: Sequelize.INTEGER,
        allowNull: false
      },
      start_time: { // Time only
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: { // Time only
        type: Sequelize.TIME,
        allowNull: false
      },
      slot_duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30 // Example default
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
    // Optional: Add index if frequently querying by day_of_week
    await queryInterface.addIndex('AvailabilityRules', ['day_of_week', 'is_active']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AvailabilityRules');
  }
};
