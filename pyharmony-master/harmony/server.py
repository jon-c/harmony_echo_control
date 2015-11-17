#!/usr/bin/env python2

"""Command line utility for querying the Logitech Harmony."""

import argparse
import logging
import pprint
import cgi
import sys
from BaseHTTPServer import BaseHTTPRequestHandler,HTTPServer

import auth
import client as harmony_client

PORT_NUMBER=8080
EMAIL='<email here>' """Your User id for harmony site"""
PASSWORD='<password here>' """Your password for the harmony site"""
HARMONY_IP='192.168.1.10'
HARMONY_PORT=5222
ACTIVITY_MAPPINGS = {'off':-1,'antenna':14337558,'watch_tv':14337362,'roku':14337392}

DEVICE_ID_MAPPINGS={'tv':27396248,'roku':27395905, 'netflix':27395905}
#TV_DEVICE_ID = 27396248;
#NETFLIX_DEVICE_ID = 27395905;

class webHandler(BaseHTTPRequestHandler):

    def do_GET(self):
      self.send_response(200)
      self.send_header('Content-type','application/json')
      self.end_headers()
      print 'GETTING  ', self.path
      args = {}
      rpath = ''
      idx = self.path.find('?')
      if idx >= 0:
          rpath = self.path[:idx]
          args = cgi.parse_qs(self.path[idx+1:])
      else:
          rpath = self.path
      print rpath
      print args
      if '/show_config' == rpath:
          show_config(self)
      elif '/start_activity' == rpath:
         activity_id =  ACTIVITY_MAPPINGS[args['activity_id'][0]]
         print activity_id
         print 'start_activity'
         start_activity(self,activity_id)
      elif '/change_channel' == rpath:
         channel =  args['channel'][0]
         print channel 
         print 'change_channel'
         change_channel(self,channel)
      elif '/do_command' == rpath:
         command =  args['command'][0]
         device_id = DEVICE_ID_MAPPINGS[args['device'][0]]
         print command 
         print 'do_command'
         do_command(self,command,device_id)
      print "Done"
      return

def login_to_logitech(self):
   print "Getting auth token"
   token = auth.login(EMAIL,PASSWORD)
   if not token:
       self.wfile.write('Could not get token from Logitech server.')
   session_token = auth.swap_auth_token(HARMONY_IP, HARMONY_PORT, token)
   if not session_token:
       sys.exit('Could not swap login token for session token.')
   return session_token


def show_config(self):
   """Connects to the Harmony and prints its configuration."""
   token = login_to_logitech(self)
   client = harmony_client.create_and_connect_client(HARMONY_IP, HARMONY_PORT, token)
   self.wfile.write(client.get_config())
   client.disconnect(send_close=True)
   return 0

def start_activity(self, activity_id):
    """Connects to the Harmony and prints its configuration."""
    token = login_to_logitech(self)
    client = harmony_client.create_and_connect_client(HARMONY_IP, HARMONY_PORT, token)
    print 'starting activity', activity_id
    pprint.pprint(client.start_activity(activity_id))
    client.disconnect(send_close=True)
    return 0

def change_channel(self, channel):
    token = login_to_logitech(self)
    client = harmony_client.create_and_connect_client(HARMONY_IP, HARMONY_PORT, token)
    print 'changing channel', channel
    pprint.pprint(client.change_channel(DEVICE_ID_MAPPINGS['tv'],channel))
    client.disconnect(send_close=True)
    return 0

def do_command(self, command,device_id):
    token = login_to_logitech(self)
    client = harmony_client.create_and_connect_client(HARMONY_IP, HARMONY_PORT, token)
    print 'doing command', command
    pprint.pprint(client.do_command(device_id,command))
    client.disconnect(send_close=True)
    return 0
    
def main():
    """Main method for the script."""
    parser = argparse.ArgumentParser(
        description='pyharmony utility script',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)

    # Required flags go here.
    required_flags = parser.add_argument_group('required arguments')
    required_flags.add_argument('--email', required=True, help=(
        'Logitech username in the form of an email address.'))
    required_flags.add_argument(
        '--password', required=True, help='Logitech password.')
    required_flags.add_argument(
        '--harmony_ip', required=True, help='IP Address of the Harmony device.')

    # Flags with defaults go here.
    parser.add_argument('--harmony_port', default=5222, type=int, help=(
        'Network port that the Harmony is listening on.'))
    loglevels = dict((logging.getLevelName(level), level)
                     for level in [10, 20, 30, 40, 50])
    parser.add_argument('--loglevel', default='INFO', choices=loglevels.keys(),
        help='Logging level to print to the console.')
    parser.add_argument('--activity_id',default='1')

    subparsers = parser.add_subparsers()
    list_devices_parser = subparsers.add_parser(
        'show_config', help='Print the Harmony device configuration.')
    list_devices_parser.set_defaults(func=show_config)

    start_activity_parser = subparsers.add_parser(
        'start_activity', help='Print the Harmony device configuration.')
    start_activity_parser.set_defaults(func=start_activity)

    args = parser.parse_args()

    logging.basicConfig(
        level=loglevels[args.loglevel],
        format='%(levelname)s\t%(name)s\t%(message)s')
    sys.exit(args.func(args))

try:
	#Create a web server and define the handler to manage the
	#incoming request
	server = HTTPServer(('', PORT_NUMBER), webHandler)
	print 'Started httpserver on port ' , PORT_NUMBER
	
	#Wait forever for incoming htto requests
	server.serve_forever()

except KeyboardInterrupt:
	print '^C received, shutting down the web server'
	server.socket.close()
