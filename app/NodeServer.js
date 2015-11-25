var Twit = require('twit')
var app = require('http').createServer(handler);
var io = require('socket.io')(app);

app.listen(3000);

function handler (req, res) {
    res.writeHead(200);
    res.end("");
}

var T = new Twit({
    consumer_key:         '5OFufhBCam4tmDhBhx8ZX2JDy'
  , consumer_secret:      'jYJ5toGFfnbpPY7hZiWskFMVOawXOY0tgLH6k3dKb0s2Lxdirp'
  , access_token:         '2986964751-TLgSztxLopsg1MOeCojMkag5a2rng3GRe0RIUT6'
  , access_token_secret:  '4l9v0qYFbTXG5lOxpILPO0YwevpT577yOnt3A2remFhwb'
});

//###################################
//If you want to use the search API (REST) then you can use this! line below, 
//In order to get data, you need to periodically pull data. Create an interval timer!
//T.get('search/tweets', { q: '#datascience', count: 100 }, function(err, data, response) {
// console.log(data)
// });


//######################
//Here you can either use a random sample, or search for something specific!
//var stream = T.stream('statuses/sample');
var stream = T.stream('statuses/filter', { track: ['datascience', 'data', 'data science'] });
//var stream = T.stream('statuses/filter', { track: ['twitpic', 'http://img', 'img'] });

//##############################
//this is just a test socket, but you could use this to get data as ell...!
// io.on('connection', function (socket) {
    // io.emit('tweets', { hello: 'world' });
// });



//console.log("INFO: Got to the point where stream is about to emit to tweets");

stream.on('tweet', function (tweet) {
//console.log(tweet);
//emitMsg('tweets', tweet);
preProcessData(tweet);
//   		 io.emit('tweets',tweet);
       io.emit('tweets',tweet);
});


//In this function we want to do some pre-processing of the incomming data stream
function preProcessData(tweet) {
    var dataParsed = false;
    var minTweetCharLen = 10;
    //How about a simple check for the length of the tweet
    if((tweet.text).length > minTweetCharLen){
        console.log('pre-processing info: Tweet Length is:'+ (tweet.text).length);
        
        //we're now happy, if so, let's make it to send the tweet off
        dataParsed = true;
    }else{
    	console.log('Did not meet requirement')
    }
    
    if(dataParsed){
        io.emit('tweets',tweet);
	updateDatabaseWithTweets(tweet,"TwitterHarvesterByRamine")
    }else{
        //Do something else,
        //If data is neeeded, then could let the front end know?
    }
      
}

//--------------Branch: MongoDB-Version
//Here we are going to be playing with MongoDB.
//We will look at saving and querying data.

//first, import the necessary package
var mongoose = require('mongoose');

//set up the database connection. 
//***NOTE: YOU NEED TO SET THE USERNAME/PASSWORD, HOSTNAME AND DATABASENAME***
mongoose.connect('mongodb://normal:secret@localhost/twitter');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log("connected to database");
});

//And we create a Schema for our new collection
var tweetDoc = new mongoose.Schema({
  source: String,
  status: String,
});

var Tweet = mongoose.model('tweets', tweetDoc); 

function updateDatabaseWithTweets(data_rec, source_name){
    try{
	console.log("Data rec" + data_rec)
	console.log(data_rec.text)
        var data = data_rec.content;

        var doc = new Tweet({
            source: source_name,
            status: data_rec,
	    text: data_rec.text
            });

        doc.save(function(err, doc) {
        if (err) return console.error(err);
        });
        console.log("Added New Items: "+data);

    }catch(e){

    }
}


//hint: you might want to checkout Model.find().stream() as this can be a better solution of you want to stream back your data!

function loadDatabaseData(socket){
    var response = [];
    Tweet.find(function (err, responses) {
        if (err) return console.error(err);
        //console.log(responses);
        try{
            //Dont want to sent too many responses
            socket.emit("historic_data", responses.slice((responses.length-5000), (responses.length-1)));
        }catch(e){
            //Looks like there isn't that many, a few will do!
     	    socket.emit("historic_data", responses);
        }
    })

}







io.on('connection', function (socket) {

     socket.on('load_data', function (data) {
        console.log("Loading New Application User");
        //console.log("emitting filter:", filter); 
        loadDatabaseData(socket);        
    });


});
