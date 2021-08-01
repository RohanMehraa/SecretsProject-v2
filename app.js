//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require ("body-parser");
const ejs = require("ejs");

const mongoose = require("mongoose");

//it's really important to use the same order of code to implement passport into your code.
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const e = require('express');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

//it's important to place the express.use(session/passport.initialize()/passport.session()) after all the use functions and before the mongoose.connect function. and in the same order written below.
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });

// To avoid the deprication warning(DeprecationWarning: collection.ensureIndex is deprecated. Use createIndexes instead) add:
mongoose.set("useCreateIndex", true);

//here we are creating a proper mongoose schema by using the function with mongoose package.
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);


// const secret = "ThisIsOurLittleSecret.";

/*plugins are extra bit of packaged code that we can add to mongoose schemas to extend their functionality or give them more power essentially. encryptedFields is used to encrypt specific fields and not all of the object. If we want to add more fields then we can add that to the array [a,b,c]. */

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']} );

/* It's important to add the plugin to the schema before creating the mongoose model, because we're parsing in the user schema as a parameter to create our new Mongoose Model. */

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
}); 

app.get("/secrets", function(req, res){
    
    if (req.isAuthenticated())
        res.render("secrets");

    else      
        res.redirect("/login");

});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/"); 
});


app.post("/register", function(req, res){
    
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err)
        {
            console.log(err);
            res.redirect("/register");
        }
        
        else
        {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }

    });

});


app.post("/login", function(req, res){
    
    const user = new User({
        username: req.body.username,
        password: req.body.password
    }); 

    req.login(user, function(err){
        
        if (err)
            console.log(err);
        else
        {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }

    });

});




app.listen(3000, function() {
    console.log("Server started on port 3000");
});