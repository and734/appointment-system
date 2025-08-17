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



## MIT License

Copyright (c) 2025 Andrea Lamberti

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


