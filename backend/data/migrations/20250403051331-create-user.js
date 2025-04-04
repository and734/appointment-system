'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', { // Table name defaults to plural 'Users'
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false // Add: Name is required
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false, // Add: Email is required
        unique: true      // Add: Email must be unique
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: true // Modify: Allow null for social login users
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,             // Add: Role is required
        defaultValue: 'customer'      // Add: Default role is 'customer'
        // Consider using ENUM for more strict role definition if your DB supports it
        // type: Sequelize.ENUM('customer', 'admin'),
      },
      social_provider: {
        type: Sequelize.STRING,
        allowNull: true // Add: Allow null if not using social login
      },
      social_id: {
        type: Sequelize.STRING,
        allowNull: true // Add: Allow null if not using social login
      },
      createdAt: { // Sequelize handles these automatically if columns exist
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Optional: set default in DB
      },
      updatedAt: { // Sequelize handles these automatically if columns exist
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Optional: set default in DB
      }
    });

    // Optional: Add an index on email for faster lookups if not added by unique:true
    await queryInterface.addIndex('Users', ['email']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};
