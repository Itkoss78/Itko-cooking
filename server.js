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
require('dotenv').config()

app.use(session({
    secret: process.env.COOKIE_PWD,
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

mongoose.connect('mongodb+srv://itsik:Itsik*21001987@cluster0.k7dz7cl.mongodb.net/cooking?retryWrites=true&w=majority');
const { Schema } = mongoose;

// PASSPORT LOCAL MONGOOSE
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(methodOverride('_method'))

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
        Receipe.findOne({ _id: req.params.id}, (err, receipeFound)=>{
            if (err) {
                console.log(err);
            } else {
                console.log(req.user.id);
                // console.log(req.params.id);
              Ingredient.find({ user: req.user.id, receipe: receipeFound.id}, (err,ingredientFound)=>{
                if (err) {
                    console.log(err)
                } else {
                    // console.log(ingredientFound);
                    // console.log(receipeFound);
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

app.post("/dashboard/myreceipes/:id/:ingredientId/edit", (req, res) => {
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
        monusername = req.session.passport.user;
       Receipe.findOne({_id:req.params.id}, (err, receipeFound)=>{
        if(err) {
            console.log(err)
        } else {
            Ingredient.findOne({_id: req.params.ingredientId},(err,ingredientFound)=>{
                if(err) {
                    console.log(err);
                } else {
                    console.log(receipeFound);
                     res.render("edit",{
                        ingredient: ingredientFound,
                        receipe: receipeFound
                     })
                }
            })
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
       Ingredient.create(newIngredient, (err,newIngredient,next)=>{
if (err) {
    console.log(err);
} else {
    id =  newIngredient.receipe;
    // id2 = " receipe :" + newIngredient.receipe;
    // direction = '/dashboard/myreceipes/';
    // urlcomp = direction + id;
    // console.log(id);
    // console.log(id2)
     req.flash("succes", "Ingredient has been added");
     
     res.redirect("/dashboard/myreceipes/"+ id  );
}
       })

// console.log("nikoumouk");

    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});

app.delete("/dashboard/myreceipes/:id/:ingredientid", (req, res) => {
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
      Ingredient.deleteOne({
        _id: req.params.ingredientid,
      }, (err) => {
        if (err) {
console.log(err);
        } else {
            // console.log(req.params.id)
            req.flash("success","Your ingredient has been deleted");
            res.redirect("/dashboard/myreceipes/" + req.params.id)
        }
      })

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
                    pass: process.env.MAIL_PWD
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

app.put("/dashboard/myreceipes/:id/:ingredientId", (req, res) => {
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
const ingredientUpdating = {
    name: req.body.name,
    bestDish: req.body.dish,
    user: req.user.id,
    quantity: req.user.quantity,
    receipe: req.params.id
}
Ingredient.findByIdAndUpdate({_id: req.params.ingredientId}, ingredientUpdating , (err,updatedIngredient)=>{
    if(err) {
        console.log(err);
    } else {
        idiseur = req.params.id;
        console.log("name "+req.body.name,);
        console.log("dish "+req.body.dish,);
        console.log("user "+req.user.id,);
        console.log("receipe "+req.params.id);
        req.flash("success", "Successfully updated ingredient");
        res.redirect("/dashboard/myreceipes/" + idiseur)
    }
});



    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});
app.get("/dashboard/favourites", (req, res) => {
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
        Favourite.find({user: req.user.id},(err, favourites)=>{
            if (err) {
                console.log(err)
            } else {
                res.render("favourites", { favourites: favourites, messages: req.flash('success', 'error') });
            }
        });

    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});
app.get("/dashboard/favourites/newfavourite", (req, res) => {
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
     res.render("newfavourite");

    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});

app.post("/dashboard/favourites/newfavourite", (req, res) => {
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
     const newFavourites = {
        image: req.body.image,
        title: req.body.title,
        description: req.body.descritption,
        user: req.user.id,
     }
Favourite.create(newFavourites, (err,newfavourite)=>{
    if (err){
        console.log(err);
    } else {
        req.flash("success", "Your favourites added");
        res.redirect("/dashboard/favourites")
    }
})
    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});

app.delete("/dashboard/favourites/:id", (req, res) => {
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
      Favourite.deleteOne({
        _id: req.params.id,
      }, (err) => {
        if (err) {
console.log(err);
        } else {
            // console.log(req.params.id)
            req.flash("success","Your Favourites has been deleted");
            res.redirect("/dashboard/favourites")
        }
      })

    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});

app.get("/dashboard/schedule", (req, res) => {
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
        Scheldule.find({user: req.user.id},(err,schedule)=>{
            if(err){
                console.log(err);
            
            } else {
                res.render("schedule",{schedule: schedule});
            }
        })
    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});
app.get("/dashboard/schedule/newschedule", (req, res) => {
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
     res.render("newSchedule");

    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});

app.post("/dashboard/schedule", (req, res) => {
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
     const newSchedule = {
        receipeName: req.body.receipename,
        schelduleDate: req.body.scheduleDate,
        time: req.body.time,
        user: req.user.id
       
     }
Scheldule.create(newSchedule, (err,newSchedule)=>{
    if (err){
        console.log(err);
    } else {
        req.flash("success", "Your Schedule added");
        res.redirect("/dashboard/schedule")
    }
})
    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});

app.delete("/dashboard/schedule/:id", (req, res) => {
    isloggedin = req.isAuthenticated();
    if (isloggedin === true) {
      Scheldule.deleteOne({
        _id: req.params.id,
      }, (err) => {
        if (err) {
console.log(err);
        } else {
            // console.log(req.params.id)
            req.flash("success","Your Schedule has been deleted");
            res.redirect("/dashboard/schedule")
        }
      })

    } else {
        req.flash('error', 'You are not logged in!');
        res.redirect("/login");
    }

});