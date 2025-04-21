
require('dotenv').config();
console.log(process.env.CLOUD_API_KEY);
const express=require('express');
const app = express();
const mongoose=require('mongoose');
const path = require("path");
var methodOverride = require('method-override');
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/Expresserror.js");
const listRoute=require("./routes/listing.js");
const reviewRoute=require("./routes/review.js");
const userRoute=require("./routes/user.js");
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore=require('connect-mongo');
const flash= require('connect-flash');
const passport=require("passport");

const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const Listing = require("./models/listing.js");
const {originalUrl}= require("./middleware.js");


const MongoUrl = process.env.ATLASDB_URL;
main().then(res=> console.log("connection was successful"))
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(MongoUrl);
}


app.use(cookieParser("secretcode"));
app.set("view engine","ejs");
app.set(("views",path.join(__dirname,"views")));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

// for session store in cloud


const sessionOptions={
   
    secret:process.env.SECRET, resave: false, saveUninitialized: true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true
    },
 };




app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());

passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.curUser=req.user;
    next();
});

// app.get("/registerUser",async(req,res)=>{
//     let fakeUser=new User({
//         email:"student@gmai.com",
//         username:"delta-student"
//     });
//     let newUser= await User.register(fakeUser,"hello@");
//     res.send(newUser);
// });



//signed cookie
// app.get("/getsignedcookie",(req,res)=>{
//         res.cookie("name","shreya",{signed:true});
//         res.send("signed cookie sent");
// });

// app.get("/verify",(req,res)=>{
//     console.log(req.cookies);    //unsigned cookie
//     console.log(req.signedCookies); //signed cookie
// });


//cookies
// app.get("/cookie",(req,res)=>{
//     res.cookie("greet","hello");
//     res.cookie("name","shreya");
//     res.cookie("hello","namste");
//     res.send("Cookies have been set!");
// });


//search route

app.get('/search', async (req, res) => {
    const query = req.query.search;
    console.log(query);
   
    try {
        const lists = await Listing.find({
            title: { $regex: new RegExp(query, 'i') } // Case-insensitive search
        });
       if(lists.length === 0){
            res.send("no listings");
        }
        else{
           res.render("listings/index.ejs",{lists})
        }

    } catch (error) {
        console.error("Error fetching listings:", error);
        res.status(500).send("Server error");
    }
});

//filter route
app.get('/filter', async (req, res) => {
    const filterType = req.query.type;
  
    try {
      const lists = await Listing.find({ category: filterType });
  
      // Check if there are no listings
      if (lists.length === 0) {
        return res.send('<h2>No listings found for this category</h2>');
      }
  
      // Build HTML dynamically
      let htmlContent = `
        <div class="row row-cols-lg-4 row-cols-md-3 row-cols-sm-2">
      `;
  
      lists.forEach(list => {
        htmlContent += `
          <a href="/listings/${list._id}">
            <div class="card col-1 listing-card" style="width: 15rem;">
              <img src="${list.image.url}" class="card-img-top" alt="listing-image" style="height:20rem;" />
              <div class="card-body">
                <p class="card-text"><b>${list.title}</b> <br/>
                  &#8377; ${list.price.toLocaleString("en-IN")}/night
                  <i class="tax-info">&nbsp; +18%GST</i>
                </p>
              </div>
            </div>
          </a>
        `;
      });
  
      htmlContent += '</div>';
  
      // Send the generated HTML as a response
      res.send(htmlContent);
  
    } catch (error) {
      console.error('Error fetching filtered listings:', error);
      res.status(500).send('Server error');
    }
  });
  
 //listings
app.use("/listings",listRoute);

//reviews
app.use("/listings/:id/reviews",reviewRoute);

//signup
app.use("/",userRoute);


//default route
app.get("*",(req,res)=>{
    throw new ExpressError(404,"No Page Found!!");
});

//Error handling middleware
app.use((err,req,res,next)=>{
  let {status =500,message="Error occured"} =err;
  res.status(status).render("error.ejs",{message});
});


app.listen(8080,()=>{
    console.log("server is listening to port 8080");
});