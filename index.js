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
  var pullRequestURL = request.body.pull_request.url;
  var patchURL = request.body.pull_request.patch_url;
  var issueURL = request.body.pull_request.issue_url;
  var labelsURL = issueURL + "/labels";

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
          httpRequest({
            url: process.env.SLACK_WEBHOOK_URL,
            method: 'POST',
            json: true,
            body: {
              text: 'New Migration PR up for review: <' + pullRequestURL + '>'
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


