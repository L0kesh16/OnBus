//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const ejs = require("ejs");
const app = express();
const shortid = require('shortid32');
const { Vonage } = require('@vonage/server-sdk')
const _ = require("lodash");
require("dotenv").config();
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(express.json());
mongoose.set('strictQuery', true);
//mongoose.connect("mongodb://localhost:27017/BusUserDB");
app.set("view engine","ejs");

const CONNECTION_URL=process.env.CON_URL;
mongoose.connect(CONNECTION_URL);
//Vonage msg
const vonage = new Vonage({
  apiKey:process.env.MSG_API_KEY,
  apiSecret:process.env.MSG_API_SECRET
})


//RazorPay 
var instance = new Razorpay({
    key_id: process.env.PAY_KEY_ID,
    key_secret: process.env.PAY_API_SECRET
});

//DB
const UserSchema = {
    name: {type:String,required:true},
    email: String,
    password: String 
};
const BusUser= mongoose.model("BusUser",UserSchema); 

const TicketSchema = {
    email:String,
    phoneno:Number,
    from:String,
    to:String,
    ticket_count:Number,
    amount:Number,
    ticketId:String,
    paymentid:String,
    date:String
}
const Ticket= mongoose.model("Ticket",TicketSchema); 

//User Registration to DB
var lemail;
app.post("/Register",function(req,res)
{
  var UserName=req.body.uname;
  var UserPass=req.body.upass;
  var UserMail=req.body.umail;
  const NewUser = new BusUser({
    name:UserName,
    email:UserMail,
    password:UserPass
    });
    NewUser.save();
    res.redirect("/login");
   
});

//Login User
app.post("/login",function(req,res){
     lemail = req.body.email;
     

  
    let lpass = req.body.pass;
    BusUser.findOne({"email":lemail},function(err,foundItems)
    {
        if(foundItems)
        {
        if(lpass === foundItems.password)
        {
           res.redirect("/dashboard");
        }
        else
        {
            res.redirect("/login")
        }
    }
    else{
        res.redirect("/login");
    }
    })
 
});



//Ticket
var money=11;
var start,end,phone,count=1;
app.post("/payment",function(req,res){
    start = req.body.from;
    end = req.body.to;
    phone = req.body.phone;
    count=req.body.count
    var from = _.capitalize(req.body.from);
    var to = _.capitalize(req.body.to);
   
    if(from=="Camproad" && to=="Kozhipanni"){

        money=8*count;
    }
    else if(from=="Mahalakshmi nagar" && to=="Camproad" || to=="Mahalakshmi nagar" && from=="Camproad"){
        money=18*count;
    }
    else if(from=="Rajkipakkam" && to=="Medakkam" || to=="Medavakkam" && from=="Rajkilpakkam"){
        money=18*count;
    }
    res.render("payment",{From:start,To:end,Amount:money});    
})


  //order
  app.post("/create/orderid",function(req,res){
  var options = {
    amount: money,  // amount in the smallest currency unit
    currency: "INR",
    receipt: "reptid"
  };
  instance.orders.create(options, function(err, order) {
    res.send({orderId :order});
  });
})









//Dashboard

app.get("/dashboard/:user",function(req,res){
    const pay_id = req.params.user;
    const ticket_id= shortid.generate();
    var da_te = new Date() ;
    var Time =da_te.toString('en-US', {timeZone: "Asia/Chennai"});
    const NewTicket = new Ticket({
        email:lemail,
        phoneno:phone,
        from:start,
        to:end,
        ticket_count:count,
        amount:money,
        ticketId:ticket_id,
        paymentid:pay_id,
        date:Time
        });
       NewTicket.save();
       res.redirect("/dashboard");
    const from = "Lokesh"
    const to = "+918838396453"
    const text = "Your's TICKET_ID: " + ticket_id+". FROM: " + start +" To: " +end +". TOTAL TICKETS: "+count+". AMOUNT PAID: "+money + "." +"TIME: " +Time+"."  ;
    async function sendSMS() {
        await vonage.sms.send({to, from, text})
            .then(resp => { console.log('Message sent successfully'); console.log(resp); })
            .catch(err => { console.log('There was an error sending the messages.'); console.error(err); });
    }
    
    sendSMS();
    
})

app.get("/dashboard",function(req,res){
    
    Ticket.find({"email":lemail},function(err,foundtickets)
    {
        if(!err){
        res.render("dashboard",{tickets:foundtickets});
        }
        else{
            console.log(err);
        }
    })

})




app.get("/",function(req,res){
    res.render("start");
})


app.get("/about",function(req,res){
    res.render("about");
})
app.get("/service",function(req,res){
    res.render("service");
})
app.get("/home",function(req,res){ 

    res.render("Home");
})
app.get("/login",function(req,res)
{
    res.render("login");
})
app.get("/Register",function(req,res)
{
    res.render("Register");
})





app.listen(process.env.PORT||3000,function(req,res)
{
    console.log("Server is Ready");
})