# Appointment Management System

This project implements an appointment management system as per the requirements.

## Structure

*   `/backend`: Node.js/Express API server
*   `/frontend`: React user interface
*   `/scripts`: Cron job scripts (e.g., email reminders)

## Setup

(Instructions will be added here later for backend and frontend setup)


cd backend
npm init -y

npm install express dotenv cors

npm install pg pg-hstore sequelize

npm install passport passport-local passport-jwt jsonwebtoken bcryptjs

npm install nodemailer

npm install node-cron

npm install --save-dev nodemon sequelize-cli

backend directory
npx sequelize-cli init:config
npx sequelize-cli init:models

npx sequelize-cli model:generate --name User --attributes name:string,email:string,password_hash:string,role:string,social_provider:string,social_id:string

mkdir data/migrations
mkdir data/seeders

npx sequelize-cli model:generate --name User --attributes name:string,email:string,password_hash:string,role:string,social_provider:string,social_id:string

**run the migration
npx sequelize-cli db:migrate


frontend

npx create-react-app .

# Routing
npm install react-router-dom

# API Calls
npm install axios

# Calendar
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction


cd src
mkdir api components contexts hooks pages services utils views
# Note: `pages` and `views` are often used interchangeably

