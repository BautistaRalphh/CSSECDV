/* 
Functions:
-This is the file that will be run during deployment or locally hosted
-Session Creation and uploading to database
-Call to connect to the MongoDB database
-NPM packages utilized
-Trigger update weekly payroll on PST: Sunday 12am/ UTC: Saturday 4pm
-Redirect to login page
*/

const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const routes = require('./routes/routes.js');
const hbs = require('hbs');
const session = require('express-session');
const database = require('./models/database.js');
const schedule = require('node-schedule');
const axios = require('axios');
const MongoStore = require('connect-mongo');
const addData = require('./add_data.js');
const addDataPayroll = require('./add_data_payroll.js');
const path =require("path")
const app = express();

dotenv.config();
const port = process.env.PORT;
const hostname = process.env.HOSTNAME;
app.set('view engine', 'hbs');

const partialsPath = path.join(__dirname, "views/partials");
hbs.registerPartials(partialsPath);

hbs.registerHelper('eq', function (a, b){
    return a === b;
});

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));

database.connect();

console.log('SESSION URI:', process.env.MONGODB_SESSION_URI);
app.use(session({
    secret: 'session-secret-key', 
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
         mongoUrl: process.env.MONGODB_SESSION_URI
    }),
    cookie: { 
        httpOnly: true, 
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use('/', routes);

//PST: Sunday 12am/ UTC: Saturday 4pm
schedule.scheduleJob('0 0 * * 0', function(){
    axios.post(`http://${hostname}:${port}/update_employee_payroll`)
        .then(response => {
            console.log(response.data);
        })
        .catch(error => {
            console.error("Error Updating Payroll:", error);
        });
});

app.use(function(req, res){
    res.status(404).send('Error 404: Page Not Found');
});

// addData.populateEmployees();
// addDataPayroll.populate_payroll();
app.listen(port, hostname, function() {
    console.log(`Server running at http://${hostname}:${port}`);
});
