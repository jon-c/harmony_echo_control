var APP_ID = undefined;//replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var https = require('https');
var http = require('http');

/**
 * The AlexaSkill Module that has the AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

var channelMap = {
	'A AND E':1615, 
	'ABC':1221, 
    'BBC':1500,
    'BRAVO':1620,
	'CBC':1205,
    'CBC News':1202,
	'CBS':1222,
	'CITY':1204,
    'CNBC':509,
    'CNN':1500,
    'COMEDY':625,
    'CP24':1503,
	'CTV':1201,
    'CTV 2':1202,
    'DISCOVERY':1520,
    'DISNEY':1562,
    'FOX':1223,
    'GLOBAL':1203,
	'HGTV':1600,
    'HISTORY':1522,
    'NBC':1220,
	'PBS':1224,
    'TREEHOUSE':1560,
	'TVO':1209,
    'TVO KIDS':1209
	};

/**
 * URL prefix to download history content from Wikipedia
 */
var urlPrefix = 'http://your_ip_or_address_and:port';

var activityCodeMapping = {'Netflix':'roku', "TV":'watch_tv','Channel':'change_channel'}

var HarmonySkill = function() {
    AlexaSkill.call(this, APP_ID);
};

var helpText =  "Voice control your Harmony Home Hub by using the keywords:  Turn On Device Name, Turn Off, Turn to channel name";
// Extend AlexaSkill
HarmonySkill.prototype = Object.create(AlexaSkill.prototype);
HarmonySkill.prototype.constructor = HarmonySkill;

HarmonySkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("HarmonySkill onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session init logic would go here
};

HarmonySkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("HarmonySkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(response);
};

HarmonySkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any session cleanup logic would go here
};


HarmonySkill.prototype.intentHandlers = {
    TurnOffIntent: function (intent, session, response) {
        handleActivity(intent, session, response,'off');
    },
    TurnOnNetflixIntent: function (intent, session, response) {
        handleActivity(intent, session, response,activityCodeMapping['Netflix']);
    },
    TurnOnTvIntent: function (intent, session, response) {
        handleActivity(intent, session, response,activityCodeMapping['TV']);
    },
    TuneToChannelIntent: function (intent, session, response) {
        handleChangeChannel(intent, session, response);
    },
    CommandIntent: function (intent, session, response) {
        handleCommand(intent, session, response);
    },
    // TurnOnMovieIntent: function (intent, session, response) {
    //     handleTurnOnMovie(intent, session, response);
    // },
    HelpIntent: function (intent, session, response) {
        var repromptText = "How can I help you?";
        response.ask({speech: helpText, type: AlexaSkill.speechOutput.PLAIN_TEXT},
                {speech: repromptText, type: AlexaSkill.speechOutput.PLAIN_TEXT});
    },

    FinishIntent: function (intent, session, response) {
        var speechOutput = "";
        response.tell({speech: speechOutput, type: AlexaSkill.speechOutput.PLAIN_TEXT});
    }
};

function getWelcomeResponse(response) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Control your Harmony Home Hub";
    var repromptText = helpText;
    var speechOutput = "<p>How can I help you?</p>";
    var cardOutput = "How can I help you?";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.

    response.askWithCard({speech: "<speak>" + speechOutput + "</speak>", type: AlexaSkill.speechOutput.SSML},
            {speech: repromptText, type: AlexaSkill.speechOutput.PLAIN_TEXT}, cardTitle, cardOutput);
}


function handleCommand(intent, session, response){
    var commandSlot = intent.slots.command;
    var deviceSlot = intent.slots.device;
    var command;
    var device;
    if(!commandSlot){
        command = "";
    }else{
         command = commandSlot.value;
    }
    if(!deviceSlot){
        device = "";
    }else{
         device = deviceSlot.value;
    }
    
    command = command.replace(' ','');
    doCall('do_command?command=' + command + "&device="+device.toLowerCase(),response);
}

function handleChangeChannel(intent, session, response){
    var channelSlot = intent.slots.channel;
    var channelName;
    if(!channelSlot){
        channelName = "";
    }else{
         channelName = channelSlot.value.toUpperCase();
    }
    console.log("heard channel " + channelName +  ' and maps to ' + channelMap[channelName]);
    
    var channel = channelMap[channelName];
    
    doCall('change_channel?channel=' + channel,response);
}


/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleActivity(intent, session, response, activity) {
    doCall('start_activity?activity_id=' + activity,response);
}

function doCall(endpoint, response){
   var url = urlPrefix + endpoint;
    console.log("URL IS " + url);
    http.get(url, function(res) {
        var body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            var speechOutput = "OK";
            response.tell({speech: speechOutput, type: AlexaSkill.speechOutput.PLAIN_TEXT}); 
        });
    }).on('error', function (e) {
        var speechOutput = "An Error occurred.  Please try again";
        response.tell({speech: speechOutput, type: AlexaSkill.speechOutput.PLAIN_TEXT});
        console.log("Got error: ", e);
    });
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HistoryBuff Skill.
    console.log("In execute")
    var skill = new HarmonySkill();
    skill.execute(event, context);
};
