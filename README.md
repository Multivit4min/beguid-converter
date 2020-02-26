SteamID <-> Battleye GUID Converter
===

__Requirements:__
* NodeJS 10 or higher
* MySQL Database
* a lot of free Disk Space (minimum 40GB)

__Disk Space Requirements:__

Depending on the setting of `guid.length` in your config the disk requirements are:
* length of 3: needs 17.6GB Disk Space per billion ids -> uses more CPU per request (but barely noticeable)
* length of 4: needs 19.6GB Disk Space per billion ids -> requires less CPU per request, but more disk space

__Limitations:__

The maximum limit of steamids which can be generated is `4,294,967,295` this is the limit of the mysql type `INT unsigned`

__Install:__

* Enter your Installation Folder and run `npm install`
* Copy the file `config.dist.yaml` to `config.yaml`
* Edit the file `config.yaml` (documentation about the settings is in this file included)
* start the programm via `lib/index.js` with node preferable with pm2 or another process manager

__How much GUIDs should be generated?__

In order to cover all SteamIDs you should generate around 2 Billion ids

__HTTP API usage:__

There are 3 endpoints to request ids:

`GET /:beguid([a-f0-9]{32})`
* This will retrieve a single SteamID
* the http status `404` will get sent if the requested id has not been converted succesfully
* the http status `200` will get sent when the id has been found
* if found it will send a `application/json` response
* the body structure is `{ data: <steamid> }`

`GET /:steamid([0-9]{17})`
* This will retrieve a single BattleyeUID
* this will always convert the steamid to a battleye uid even when its not in a valid range
* it will send a `application/json` response
* the body structure is `{ data: <beguids> }`

`POST / [<steamid/beguid>]`
* POST endpoint allows multiple steamids or beguids to be converted
* it require a `application/json` body with an array of valid steamids or battleye uids
* it will send a `application/json` response
* it will send http status `400` if the body is not an array
* it will send http status `400` if the included array given in the body has more keys than set in the `config.js`
* it will send http status `400` if one of the keys are invalid formatted (only pattern `/^([a-f0-9]{32}|\d{17})$` allowed)
* the response data will hold the requested steamid / beguid as key and the retrieved value as value, if the beguid was not successfully converted it will have `null` as value

__Docker:__

You can also build this app as a docker image:
`docker build -t multivit4min/beguid-converter .`
And the run it using this command:
`docker run -p 49160:6051 -d multivit4min/beguid-converter`
This will expose the webserver in port 49160, you can adapt this to the port of your choice.

This is just a very basic Docker image installing dependencies and launching the web server. Networking/database setup is still required.
You can open the console.js by opening the container's bash by using `docker exec -it 0a17ffd4db41 /bin/bash` (replace the container ID with yours) and then running `node console.js`.