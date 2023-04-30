// init requirements

var express = require('express')
var bodyParser = require('body-parser')
const mongoose = require('mongoose');

// load env variables

const port = process.env.PORT || 8081;
const connString = process.env.CON_STR || "";

// init express
var app = express();
var jsonParser = bodyParser.json()
app.use(bodyParser.urlencoded({ extended: true }));

// connect to mongoose server
async function init(){
    console.log("starting..");
    mongoose.connect(connString);
    console.log("connected");
}

// start express web server
var server = app.listen(port, function() {
    var _host = server.address().address;
    var _port = server.address().port;

    console.log("Server is running at "+_host+":"+_port);
});

// start mongoose
init().catch(err => console.error(err));

// create schema
const SongSchema = new mongoose.Schema({
    _id: String,
    name: String,
    album: String,
    artist: String
});

const Songs = mongoose.model('Song', SongSchema);

// return all objects in database
app.get('/api/getall', function(req, res){
    async function fetchData(){
        try{
            // get all data from database and retuns it with status code 200 if successfull
            const data = await Songs.find({});
            res.status(200);
            res.send(data);
        }catch{
            // if error, return status code 500
            res.status(500);
            console.error("Cannot fetch data");
        }
    }
    fetchData();
});

// return object by id
app.get('/api/getsong:id', function(req, res){
    async function exec(){
        try{
            // parse id from request parameters
            var id = parseInt(req.params.id.substring(1));

            // get element by id
            const ret = await Songs.find({_id:id});

            // if object cannot be found, return status code 404. Otherwise return status code 200 and object
            if(ret.length == 0){res.status(404); res.send("Data not found");console.error("Data not found");return;}

            res.status(200);
            res.send(ret);
        }catch{
            res.status(500);
            console.error("Data not found");
        }
    }
    exec();
});

// create new object and add to database
app.post('/api/add', jsonParser, function(req, res){
    try{
        // set new values to new object.
        const newSong = new Songs({name: req.body.name, album: req.body.album, artist:req.body.artist});
        
        // if some any of values is null, return status code 400
        if(!newSong.name || !newSong.album || !newSong.artist){res.status(400); res.send("Invalid information"); return;}
    
        async function exec(){
            // get new unused index for new object
            var len = (await Songs.find()).length - 1;
            var ret = await Songs.find({_id:len});
            while(ret.length != 0){
                len+=1;
                ret = await Songs.find({_id:len});
            }
            
            // save new object to database and return status code 201 and created object
            newSong._id = len;
            newSong.save();
        
            res.status(201);
            res.send(newSong);
        }
        exec();
    }catch{res.status(500); res.send();}
});

// update existing objects values
app.put('/api/update:id', jsonParser, function(req, res){
    async function exec(){
        try{
            // variable for keeping track number of changes made during function
            var changes = 0;

            // parse id
            var id = parseInt(req.params.id.substring(1));

            // check if there is object with given id. if not, return status code 404
            var song = await Songs.find({_id:id});
            if(song.length == 0){res.status(404);res.send();return;}

            // check if there is any changes given. if not, return status code 400
            var dat = req.body;
            if(dat.length == 0){res.status(400);res.send();return;}

            // check which values has changed, and set new values
            if(dat.hasOwnProperty("name")){ await Songs.updateOne({_id:id}, { name: dat.name }); changes+=1;}
            if(dat.hasOwnProperty("album")){await Songs.updateOne({_id:id}, { album: dat.album });changes+=1;}
            if(dat.hasOwnProperty("artist")){await Songs.updateOne({_id:id}, { artist: dat.artist });changes+=1;}
            
            // if 0 changes has made, return status code 400. if function succeed, return status code 200
            if(changes == 0){res.status(400);res.send();return;}

            res.status(200);
            res.send();
        }catch{
            res.status(500);
            console.error("Cannot fetch data");
        }
    }
    exec();
});

// deletes object by id
app.delete('/api/delete:id', function(req, res){
    async function exec(){
        try{
            // parse id
            var id = parseInt(req.params.id.substring(1));
            
            // check if there is object with given id. if not, return status code 404
            var song = await Songs.find({_id:id});
            if(song.length == 0){res.status(404);res.send();return;}
            
            // remove object
            await Songs.deleteOne({_id:id},{});

            res.status(200);
            res.send();
        }catch{
            res.status(500);
            console.error("Cannot fetch data");
        }
    }
    exec();
});