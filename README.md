Echo Harmony
===============

Provides support of your Harmony home hub through the Amazon Echo.   This consists of two projects,

A server forked off the pyharmony project started by Jeff Terrace and added to by Pete LePage and a Lambda javascript
project.  


Status
------

* Authentication to Logitech's web service working.
* Authentication to harmony device working.
* Querying for entire device information
* Sending a start activity command
* Sending individual commands such as play, pause, stop etc
* Changing channels

Usage
-----

Setting up the server
======================

Edit the server.py entering your 

EMAIL for your harmony account
PASSWORD for your harmony account.
HARMONY_IP IP address of your harmony device.

Next you need to get configuration parameters for different devices.

start the server using:

python server.py

To query your device's configuration state:

    http://<ipaddress>:<port>/show_config
    
Note the device ids of the various devices you have available on your harmony (do a search for "deviceTypeDisplayName" on the JSON)
ex: 
Roku:12346567
TV: 987654532

Update 
TV_DEVICE_ID = 27396248;
NETFLIX_DEVICE_ID = 27395905;

Next, note down activity ids for various activities you've created (do a search for isAVActivity": true

update ACTIVITY_MAPPINGS with your activity_name:activity_id.

ex.
ACTIVITY_MAPPINGS = {'off':-1,'antenna':123123,'watch_tv':123185234,'roku':123123129}

Once this is done, restart the server.

Test your activities

http://<ipaddress>:<port>/start_activity?activity_id=activity_name

and devices with 

http://<ipaddress>:<port>/do_command?command=pause&device=netflix

You're done with the server but you may need to setup port forwarding on your router to route requests from the 
Echo to your server.  I'd also suggest getting a dynamic dns name if your ip changes frequently.

Setting up the Echo Lambda
===========================

Register for AWS if you don't already have an account.   

Login to your AWS account and go to Lambda

Follow these instructions to create a new Lambda ("Create a New Lambda Function")

https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/developing-an-alexa-skill-as-a-lambda-function

You will come back here in after to upload code, but for now, grab the ARN under

"Lambda->Functions"

Select the newly created functions, click on "Actions"->"Show ARN".
 
Setting up the Alexa App
==========================

In a new tab or Window, go to https://developer.amazon.com and register for Echo developer if you've not already done so.

Select "Apps and Services"

Click on "Alexa"

Click on "Alexa Skills Kit - Get Started"

Click on "Add a new skill"

Name:  Harmony
Invocation Name:  however you'd like to call it.  I used "tv"
Version:0.1
Endpoint:  Lambda = your lambda arn> from above


Click Next

Under js/speechAssets, you will find

intentSchema.json

Custom Slot Types

LIST_OF_CHANNELS = listOfChannels.  Provides a list of channels that map in the index.js file.  You may want to edit this
LIST_OF_COMMANDS = listOfCommands.  Some commands that Harmony supports.
LIST_OF_DEVICES = listOfDevices.  This is the device keywords you want to use.  Can be mapped in index.js

SampleUtterances.txt

After you input the above, edit the index.js and upload it to your Lambda

edit the index.js and change 

channelMap <-Maps channels used in the Alexa Utterances to actual channels
urlPrefix <-Ip or hostname of your python server.  This must be accessible from the Internet.  ex http://<dynhost>:<portnumber>/
activityCodeMapping <- Friendly words such as "Netflix" that you map to an harmony activity.  

Once done, create a zip file in the js/src directory that contains index.js and AlexaSkill.js with no directories.

Go to the Lambda you created before, click on "Code", select "Upload a zip" and upload the zip file above by clicking "Save"


Testing your Alexa Skill

Go to the Alexa developer console and select "Test"

Enter Utterance

turn on tv
turn to CBS
turn to ABC

turn on netflix
pause netflix
play netflix

Monitoring Lambda Logs

On the Lambda, go to Monitoring and select "View Logs in Cloudwatch".   Refresh the logs to get new invovations 

TODO
========
Code is messy but functional.    
