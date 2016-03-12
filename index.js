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
  var issuesURL = request.body.repository.issues_url;
  var labelsURL = issuesURL + "/labels";
  var labelsURL = 'https://api.github.com/repos/stephenchen13/gboom/issues/5/labels';

  console.log(issuesURL);
  console.log(labelsURL);

  httpRequest({
    url: labelsURL,
    headers: {
      'User-Agent': 'stephenchen13',
      'Authorization': 'token ' + process.env.OAUTH_TOKEN
    }
  }, function(error, response, body) {
    console.log(error);
    console.log(response.statusCode);
    console.log(body);
    if (!error && response.statusCode == 200) {
      var labels = JSON.parse(body);
      var reviewLabelPresent = false;
      labels.forEach(function(label, index, array) {
        var labelRegExp = new RegExp('bug', 'i');
        if (labelRegExp.test(label.name)) {
          reviewLabelPresent = true;
        }
      });
      console.log(reviewLabelPresent);

      if (reviewLabelPresent) {
        //post to slack
      }
    }
  });

  response.sendStatus(200);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


