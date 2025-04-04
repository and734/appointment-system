'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs'); // Import bcrypt

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Appointment, { // User can have many Appointments
        foreignKey: 'customer_id',
        as: 'appointments' // Alias to use when querying
      });
    }

    // Add password comparison method
    async comparePassword(candidatePassword) {
      // Use 'await' since bcrypt.compare is asynchronous
      // Need to handle the case where password_hash is null (social login)
      if (!this.password_hash) {
          return false;
      }
      return await bcrypt.compare(candidatePassword, this.password_hash);
    }
  }
  User.init({
    // Ensure attributes match migration (Sequelize often infers types well)
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { // Add email validation
        isEmail: true,
      }
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'customer'
    },
    social_provider: {
      type: DataTypes.STRING,
      allowNull: true
    },
    social_id: {
      type: DataTypes.STRING,
      allowNull: true
    }
    // createdAt and updatedAt are handled by Sequelize by default if timestamps: true (default)
  }, {
    sequelize,
    modelName: 'User',
    // Optional: Add hooks for password hashing before saving
    hooks: {
        beforeCreate: async (user) => {
            if (user.password_hash) { // Only hash if password is provided
                const salt = await bcrypt.genSalt(10);
                user.password_hash = await bcrypt.hash(user.password_hash, salt);
            }
        },
        beforeUpdate: async (user) => {
            // Only hash if password field is being changed
            if (user.changed('password_hash') && user.password_hash) {
                const salt = await bcrypt.genSalt(10);
                user.password_hash = await bcrypt.hash(user.password_hash, salt);
            }
        }
    }
  });
  return User;
};
