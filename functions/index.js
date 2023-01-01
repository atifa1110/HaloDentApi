const functions = require("firebase-functions");
var admin = require("firebase-admin");
var serviceAccount = require("./client.json");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://halo-dent-default-rtdb.firebaseio.com"
});

//define the google api
var {google} = require('googleapis');
//define the message scope 
var MESSAGING_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
var SCOPES = [MESSAGING_SCOPE];

//using express framework
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
var router = express.Router();

//so we can read title,body and token
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

//make router send notification Chat
router.post('/chat',function(req, res){
  getAccessToken().then(function(access_token){
      var token = req.body.token;
      var title = req.body.title;
      var body = req.body.body;
      var image = req.body.image;
      var chatid = req.body.chatid;
      var to = "Chat";

      const message = {
        token: token,
        data :{
          title: title,
          body: body,
          image: image,
          chatid: chatid,
          to:to
        }
      };

      admin.messaging().send(message).then(response => {
          res.status(200).json({message});
          //res.status(200).send("Notification sent successfully : " + response);
       })
       .catch( error => {
          console.log(error);
       });
      
  });
});

//make router send notification group chat
router.post('/send',function(req, res){
    getAccessToken().then(function(access_token){
        var token = req.body.token;
        var token1 = req.body.token1;
        var title = req.body.title;
        var body = req.body.body;
        var image = req.body.image;
        var chatid = req.body.chatid;
        var to = "Group";
        const tokens = [token,token1];  

        const options = {
          hostname: 'fcm.googleapis.com',
          path: 'https://fcm.googleapis.com/v1/projects/halo-dent/messages:send',
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + access_token
          }
         };

        const message = {
          tokens: tokens,
          data :{
            title: title,
            body: body,
            image: image,
            chatid: chatid,
            to:to
          }
        };

        admin.messaging().sendMulticast(message).then(response => {
          res.status(200).json({message});
          //res.status(200).send("Notification sent successfully : " + response.successCount);
         })
         .catch( error => {
            console.log(error);
         });
    });
});

app.use('/api', router);

//make function to get private token firebase
function getAccessToken(){
  //return promise 
    return new Promise(function(resolve, reject) {
      //get key from admin firebase 
        var key = require("./service-account.json");
        //define client email and provate key
        var jwtClient = new google.auth.JWT(
          key.client_email,
          null,
          key.private_key,
          SCOPES,
          null
        ); 
        //authorize client if it is error or get token
        jwtClient.authorize(function(err, tokens) {
          if (err) {
            //if there is error we reject and return error
            reject(err);
            return;
          }
          //if not get token
          resolve(tokens.access_token);
        });
      });
}

exports.api = functions.https.onRequest(app);
