var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var httpRequest = require('request');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.post('/github_webhook', function(request, response) {
  var action = request.body.action;
  var number = request.body.number;
  var pullRequestURL = request.body.pull_request.html_url;
  var patchURL = request.body.pull_request.patch_url;
  var issueURL = request.body.pull_request.issue_url;
  var labelsURL = issueURL + "/labels";
  var messages = [
    "M-M-Morty! There's a m-m-migration to review! Let's go! *burp*",
    "Ohhh yeahhh, you gotta get schwifty!",
    "They're robots Morty! It's OK to shoot them! They're just robots!",
    "WUBBA LUBBA DUB DUB!",
    "You're not gonna believe this, because it usually never happens, but I made a mistake",
    "This isn't Game of Thrones, Morty",
    "I'm sorry Summer, your opinion means very little to me",
    "Yo! What up my glip glops!",
    "I'm not looking for judgement, just a yes or no. Can you assimilate a giraffe?",
    "You really are your father's children. Think for yourselves, don't be sheep."
  ];

  if (action === 'labeled') {
    httpRequest({
      url: labelsURL,
      headers: {
        'User-Agent': process.env.GITHUB_USER_AGENT,
        'Authorization': 'token ' + process.env.OAUTH_TOKEN
      }
    }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var labels = JSON.parse(body);
        var reviewLabelPresent = false;
        var migrationLabelPresent = false;
        labels.forEach(function(label, index, array) {
          var pendingLabelRegExp = new RegExp('pending review', 'i');
          var migrationLabelRegExp = new RegExp('migration', 'i');
          if (pendingLabelRegExp.test(label.name)) {
            reviewLabelPresent = true;
          }
          if (migrationLabelRegExp.test(label.name)) {
            migrationLabelPresent = true;
          }
        });
        if (reviewLabelPresent && migrationLabelPresent) {
          var message = messages[Math.floor(Math.random() * messages.length)];

          httpRequest({
            url: process.env.SLACK_WEBHOOK_URL,
            method: 'POST',
            json: true,
            body: {
              username: 'Rick Sanchez',
              icon_emoji: ':rick:',
              text: message + " <" + pullRequestURL + ">"
            }
          }, function(error, response, body) {
          });
        }
      }
    });
  }

  response.sendStatus(200);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


