var express = require('express')
var bodyParser = require('body-parser')
const mongoose = require('mongoose');

const port = process.env.PORT || 8081;
const connString = process.env.CON_STR || "";

var app = express();
var jsonParser = bodyParser.json()
// var urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use(bodyParser.urlencoded({ extended: true }));

async function init(){
    console.log("starting..");
    mongoose.connect(connString);
    console.log("connected");
}

var server = app.listen(port, function() {
    var _host = server.address().address
    var _port = server.address().port

    console.log("Server is running at "+_host+":"+_port)

})

init().catch(err => console.error(err));

const SongSchema = new mongoose.Schema({
    _id: String,
    name: String,
    album: String,
    artist: String
});

const Songs = mongoose.model('Song', SongSchema);

app.get('/api/getall', function(req, res){
    async function fetchData(){
        try{
            const data = await Songs.find({}).limit(10);
            res.status(200);
            res.send(data);
        }catch{
            res.status(500);
            console.error("Cannot fetch data");
        }
    }
    fetchData();
});

app.get('/api/getsong:id', function(req, res){
    async function exec(){
        try{
            var id = parseInt(req.params.id.substring(1));
            const ret = await Songs.find({_id:id});
            if(ret.length == 0){res.status(404); res.send("Data not found");console.error("Data not found");return;}
            
            res.status(200);
            res.send(ret);
        }catch{
            res.status(404);
            console.error("Data not found");
        }
    }
    exec();
});

app.post('/api/add', jsonParser, function(req, res){
    try{
        const newSong = new Songs({name: req.body.name, album: req.body.album, artist:req.body.artist});
        
        if(!newSong.name || !newSong.album || !newSong.artist){res.status(404); res.send("Add failed"); return;}
    
        async function exec(){
            var len = (await Songs.find()).length - 1;
            var ret = await Songs.find({_id:len});
            while(ret.length != 0){
                len+=1;
                ret = await Songs.find({_id:len});
            }
    
            newSong._id = len;
            newSong.save();
        
            res.status(201);
            res.send(newSong);
        }
        exec();
    }catch{res.status(500); res.send();}
});

app.put('/api/update:id', jsonParser, function(req, res){
    async function exec(){
        try{
            var changes = 0;
            var id = parseInt(req.params.id.substring(1));
            var song = await Songs.find({_id:id});
            if(song.length == 0){res.status(404);res.send();return;}

            var dat = req.body;

            if(dat.length == 0){res.status(400);res.send();return;}

            if(dat.hasOwnProperty("name")){ await Songs.updateOne({_id:id}, { name: dat.name }); changes+=1;}
            if(dat.hasOwnProperty("album")){await Songs.updateOne({_id:id}, { album: dat.album });changes+=1;}
            if(dat.hasOwnProperty("artist")){await Songs.updateOne({_id:id}, { artist: dat.artist });changes+=1;}
            
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

app.delete('/api/delete:id', function(req, res){
    async function exec(){
        try{
            var id = parseInt(req.params.id.substring(1));
            
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