const express = require('express')
const crypto = require('crypto');
var bodyParser = require('body-parser');
var $ = require("jquery");
const app = express();
const port = 3000
var cookieParser = require('cookie-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const methodOverride = require("method-override");
const flash = require("connect-flash");
const bcrypt = require('bcrypt');
var passport = require('passport');
var LocalStrategy = require('passport-local');
const session = require('express-session');
const nodemailer = require("nodemailer");
const passportLocalMongoose = require("passport-local-mongoose");
//MODELS
const User = require("./models/user");
const Reset = require("./models/reset");
const Favourite = require("./models/favourites");
const Ingredient = require("./models/ingredients");
const Receipe = require("./models/receipes");
const Scheldule = require("./models/scheldules");
// Create a token generator with the default settings:
var randtoken = require('rand-token');
const { cp } = require('fs');
const user = require('./models/user');
const ingredients = require('./models/ingredients');
const { Console } = require('console');


app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: false
}));

app.use(flash());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();

})
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended: false }));

app.listen(3000, () => {
    console.log("server is running on port 3000");
});
app.set('view engine', 'ejs');
app.use(express.static("public"));

mongoose.connect('mongodb+srv://itkoss87:Itsik*21001987@cluster0.ohcruvt.mongodb.net/cooking?retryWrites=true&w=majority');
const { Schema } = mongoose;

// PASSPORT LOCAL MONGOOSE
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", (req, res) => {
    res.render("index")
})



app.get("/signup", (req, res) => {
    res.render("signup")
});

app.post("/signup", (req, res) => {
    const newUser = new User({
        username: req.body.username,
    });
    User.register(newUser, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            return res.render("signup")
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("signup")
            })
        }
    });
});

app.get("/login", (req, res) => {
    res.render("login", { messages: req.flash('success', 'error') });
});
app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                req.flash('success', 'You are now logged in!');
                res.redirect("/dashboard");


            })
        }
    })
});

app.get("/dashboard", (req, res) => {

    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
        monusername = req.session.passport.user;
        res.render("dashboard", { messages: req.flash('success', 'error') });
    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});

app.get("/dashboard/myreceipes", (req, res) => {
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
        Receipe.find({
            user: req.user.id
        }, (err, receipe) => {
            if (err) {
                console.log(err);
            } else {

                res.render("receipe", { receipe: receipe, messages: req.flash('success', 'error') });
            }

        })
    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});

app.get("/dashboard/newreceipe", (req, res) => {
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
        res.render("newreceipe")

    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});

app.post("/dashboard/newreceipe", (req, res) => {
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
        const newReceipe = {
            name: req.body.receipe,
            image: req.body.logo,
            user: req.user.id
        }

        Receipe.create(newReceipe, (err, newReceipe) => {
            if (err) {
                console.log(err)
            } else {
                req.flash("success", "New receipe added");
                res.redirect("/dashboard/myreceipes")
            }
        })

    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});

app.get("/dashboard/myreceipes/:id", (req,res)=>{
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
        Receipe.findOne({ user: req.params.id}, (err, receipeFound)=>{
            if (err) {
                console.log(err);
            } else {
                // console.log(receipeFound);
                // console.log(req.params.id);
              Ingredient.find({user: req.params.id, receipe: receipeFound.id}, (err,ingredientFound)=>{
                if (err) {
                    console.log(err)
                } else {
                    console.log(receipeFound.name);
                    console.log(req.params.id),
                    res.render("ingredients",{
                        ingredient: ingredientFound,
                        receipe: receipeFound
                    });
                }
              }
              ) 
            }
        })
    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});

app.get("/dashboard/myreceipes/:id/newingredient", (req, res) => {
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
       Receipe.findById({_id: req.params.id}, (err, ReceipeFound)=>{
        if(err) {
            console.log(err)
        } else {
            res.render("newingredient", {receipe: ReceipeFound})
        }
       })



    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});

app.post("/dashboard/myreceipes/:id", (req, res) => {
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
        //  console.log(req.user.id);
        // console.log(req.body.dish);
        // console.log(req.body.quantity);
       const newIngredient = {
        name: req.body.name,
        bestDish: req.body.dish,
        user: req.user.id,
        quantity: req.body.quantity,
        receipe: req.params.id
       }
       Ingredient.create(newIngredient, (err,newIngredient)=>{
if (err) {
    console.log(err);
} else {
    recetteid = newIngredient.receipe;
    // console.log(newIngredient.receipe);
     req.flash("succes", "Ingredient has been added");
     res.redirect("/dashboard/myreceipes/" );
}
       })

console.log("nikoumouk");

    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});

app.get("/dashboard/favourites", (req, res) => {
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
        res.render("favourites", { messages: req.flash('success', 'error') });
    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});



app.get("/logout", (req, res) => {

    req.logout((err) => {
        if (err) {
            console.log(err)
        } else {
            req.flash("success", "Congratulations you are logged Out");
            res.redirect("/login");

        }
    });

})
app.get("/forgot", (req, res) => {
    res.render("forgot",)

});

app.post("/forgot", (req, res) => {

    User.findOne({ username: req.body.username }, (err, userFound) => {
        if (userFound) {
            const token = randtoken.generate(16);
            Reset.create({
                username: userFound.username,
                resetPasswordToken: token,
                resetPasswordExpired: Date.now() + 3600000
            });
            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true, // true for 465, false for other ports
                auth: {
                    user: "hassine.itsik87@gmail.com", // generated ethereal user
                    pass: "xflroxaoiqehowzd"
                },
            });
            const mailOption = {
                from: "hassineitsik1@gmail.com",
                to: req.body.username,
                subject: "link to reset your password",
                text: "click on this link to reset your passport: http://localhost:3000/reset/" + token
            }
            console.log("Le mail est pret à partir");

            transporter.sendMail(mailOption, (err, response) => {
                if (err) {
                    console.log(err);
                } else {
                    req.flash('success', 'Please check your emails')
                    res.redirect("/login");
                }
            })
        } else {

            req.flash("error", "Wrong Username");
            res.redirect("/login");
        }
    })
});

app.get("/reset/:token", (req, res) => {
    Reset.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpired: { $gt: Date.now() }

    }, (err, obj) => {
        if (err) {
            req.flash('error', 'Token Exipired')
            res.redirect("/login");
        } else {
            res.render("reset", {
                token: req.params.token
            })
        }
    });
});
app.post("/reset/:token", (req, res) => {
    Reset.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpired: { $gt: Date.now() }

    }, (err, obj) => {
        if (err) {
            req.flash('error', 'Token Exipired')
            res.redirect("/login");
        } else {

            if (req.body.password1 == req.body.password2) {
                User.findOne({ username: obj.username }, (err, user) => {
                    if (err) {
                        console.log(err)
                    } else {

                        user.setPassword(req.body.password1, function (err, user) {
                            if (err) {
                                console.log(err);

                            } else {
                                user.save();
                                const updateReset = {
                                    resetPasswordToken: null,
                                    resetPasswordExpired: null
                                }
                                Reset.findOneAndUpdate({ resetPasswordToken: req.params.token }, updateReset, (err) => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        req.flash('success', 'Your password is changed')
                                        res.redirect("/login");
                                    }
                                });
                            }
                        }
                        );
                    }
                });
            }

        }
    });
});

// Fonction qui verifie si le user est connect
// function isLoggedIn(req, res, next) {
//     if (req.isAuthenticated()=true) {
//         return next();
//     } else {
//         req.flash("error", "please login first")
//         res.redirect("/login");
//     }
// }
// function loggedIn(req, res, next) {
//     if (req.session.passport.user) {
//         next();
//     } else {
//         req.flash("error", "please login first");
//         res.redirect('/login');
//     }
// }

