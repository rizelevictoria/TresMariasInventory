require("dotenv").config();
const exphbs = require('express-handlebars');
const session = require("express-session")
const express = require("express");
const bodyParser = require('body-parser');
const app = express();
const hostname -="0.0.0.0";
const port = process.env.PORT || 5000

// Middleware
app.use(express.json());

app.use(express.urlencoded({extended: true}));

const handlebars = exphbs.create({ extname: '.hbs' });
app.engine('.hbs', handlebars.engine);
app.set('view engine', '.hbs');

app.use( session({
    key: 'keyin',
    secret: process.env.SECRET_SESSION,
    resave: false,
    saveUninitialized: true
}))

// Redirect requests to endpoint starting with /posts to postRoutes
// To use custom CSS
app.use(express.static(__dirname + '/public'));
app.use("/", require("./routes/postRoutes"));

app.get('/', (req, res) => {
    res.render('login', {layout: 'credential.hbs'});
});

// Catching errorsS
app.use((err, req, res, next) => {
    console.log(err.stack);
    console.log(err.name);
    console.log(err.code);

    res.status(500).json({
        message: "Something went wrong.",
    });
});

// Listen on pc port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));