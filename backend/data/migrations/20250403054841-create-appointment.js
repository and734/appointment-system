'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Appointments', { // Plural name
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      customer_id: { // Foreign Key
        type: Sequelize.INTEGER,
        allowNull: false, // Or true if you want to keep appointments even if user is deleted
        references: {
          model: 'Users', // Name of the target table (created in previous migration)
          key: 'id',
        },
        onUpdate: 'CASCADE', // If user ID changes, update here
        onDelete: 'CASCADE' // If user is deleted, delete their appointments (or SET NULL / RESTRICT)
      },
      start_time: { // Specific date and time
        type: Sequelize.DATE, // DATE includes time (TIMESTAMP WITH TIME ZONE in Postgres)
        allowNull: false
      },
      end_time: { // Specific date and time
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'scheduled' // e.g., scheduled, confirmed, cancelled_by_customer, cancelled_by_admin, completed, paid
        // Consider ENUM if DB supports it and you want strict values
        // type: Sequelize.ENUM('scheduled', 'confirmed', ...),
      },
      notes: { // Optional notes from customer or admin
        type: Sequelize.TEXT,
        allowNull: true
      },
      reminder_sent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
    // Add indexes for common query columns
    await queryInterface.addIndex('Appointments', ['customer_id']);
    await queryInterface.addIndex('Appointments', ['start_time']);
    await queryInterface.addIndex('Appointments', ['status']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Appointments');
  }
};
