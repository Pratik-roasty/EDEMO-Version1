//required packages
require("dotenv").config();
const express=require("express");
const ejs=require("ejs");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");

//needed initialization
const app=express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
  }));
  
  app.use(passport.initialize());
  app.use(passport.session());

//database connected
mongoose.connect(process.env.URI);



//database creation
const userSchema=new mongoose.Schema({
    username: String,
    password: String,
    name: String,
    email: String,
});
userSchema.plugin(passportLocalMongoose);
const pollSchema=new mongoose.Schema({
    title: String,
    candidates: Array,
    publisher: String,
    pollID: String,
    votes: [Number]
});
const User=new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
const Poll=new mongoose.model("Poll",pollSchema);

//all the routes

//home route
app.get("/",function(req,res){
    res.render("index");
});
//login route
app.get("/login",function(req,res){
    res.render("login");
});
//checking credentials
app.post("/login",function(req,res){
    const user=new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user,function(err){
        if(err){
            console.log(err);
        } else{
            passport.authenticate("local",{ failureRedirect: '/login' })(req,res,function(){
                res.redirect("/"+req.body.username);
            })
        }
    })
})
//registering user route
app.get("/register",function(req,res){
    res.render("register");
});
//saving details into database.
app.post("/register",function(req,res){
    User.register({username: req.body.username,name: req.body.name,email: req.body.email},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        } else{
            passport.authenticate("local",{failureRedirect: '/register'})(req,res,function(){
                res.redirect("/"+req.body.username);
            })
        }
    })
});

app.get("/:userRoute",function(req,res){
    if(req.isAuthenticated()){
        const username=req.params.userRoute;
        User.findOne({username: username},function(err,foundUser){
            if(err){
                console.log(err);
            } else{
                if(foundUser){
                    res.render("dashboard",{username: username,email: foundUser.email,name: foundUser.name});
                }else{
                    res.send("User not found");
                }
            }
        })
    } else{
        res.redirect("/login");
    }
})

app.get("/:userRoute/about",function(req,res){
    if(req.isAuthenticated()){
        const username=req.params.userRoute;
        console.log(username);
        res.render("about",{username: username});
    } else{
        res.redirect("/login");
    }
})

app.get("/:userRoute/create",function(req,res){
    if(req.isAuthenticated()){
        const username=req.params.userRoute;
        res.render("create",{username: username});

    } else{
        res.redirect("/login")
    }
})
app.get("/:userRoute/active",function(req,res){
    if(req.isAuthenticated()){
        const username=req.params.userRoute;
        Poll.find({}, function(err,foundPolls){
            if(err){
                console.log(err);
            }else{
                res.render("active",{username: username,polls: foundPolls});
            }
        });

    } else{
        res.redirect("/login")
    }
});

app.get("/:userRoute/account",function(req,res){
    if(req.isAuthenticated()){
        User.findOne({username: req.params.userRoute},function(err,foundUser){
            if(err){
                console.log(err);
            }else{
                Poll.find({publisher: foundUser.username},function(err,foundPolls){
                    if(err){
                        console.log(err);
                    } else{
                        res.render("account",{user:foundUser,polls:foundPolls});
                    }
                })
            }
        })
    }
    else{
        res.redirect("/login");
    }
});

app.get("/:userRoute/:pollTitle/candidates",function(req,res){
    if(req.isAuthenticated()){
        const username=req.params.userRoute;
        Poll.findOne({publisher: username,title: req.params.pollTitle},function(err,poll){
            if(err){
                console.log(err);
            } else{
                res.render("candidates",{user:username, id: poll.pollID, title: poll.title, candidateArray: poll.candidates});
            }
        });
    }
    else{
        res.redirect("/login");
    }
});

app.get("/:userRoute/:title/delete",function(req,res){
    if(req.isAuthenticated()){
        Poll.deleteOne({publisher: req.params.userRoute, title: req.params.title},function(err){
            if(err){
                console.log(err);
            }
            else{
                res.redirect("/"+req.params.userRoute);
            }
        })
    }
    else{
        res.redirect("/login");
    }
})

app.post("/:userRoute/create",function(req,res){
    if(req.isAuthenticated()){
        const username=req.params.userRoute;
        const poll=new Poll({
            pollID: req.body.pollID,
            title: req.body.pollTitle,
            publisher: username,
            candidates: []
        });
        poll.save();
        res.redirect("/"+username+"/"+poll.title+"/candidates");
    } else{
        res.redirect("/login");
    }

});

app.post("/:userRoute/candidates",function(req,res){
    if(req.isAuthenticated()){
        const username=req.params.userRoute;
        Poll.findOne({publisher:username},function(err,poll){
            if(err){
                console.log(err);
            } else{
                poll.candidates.push(req.body.candidate);
                poll.save();
                res.redirect("/"+username+"/candidates");
            }
        })
    }
    else{
        res.redirect("/login");
    }
})

app.get("/:userRoute/logout",function(req,res){
    console.log(req.params.userRoute+" out");
    req.logout();
    res.redirect("/");
})

app.listen(3000,function(req,res){
    console.log("Server started at port 3000");
})