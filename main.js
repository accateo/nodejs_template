/* ---------------------------------------------------------------------
 * Nodejs template
 * 
 * Application template in NodeJs
 * 
 * */

// Add timestamp to logs 
require('./console-log.js');

// Mail forwarder
var mailSender=require('./mail-send');

// include the manager object containing the logics
var mng =require("./manager.js");

// include the libraries used
const fs = require("fs");
const express = require("express");
const fileUpload = require('express-fileupload');
const bridgeReq = require("axios");
const keepAgent = require('agentkeepalive');


/** Application version **/
var gAppVersion = require('./package.json').version;

/** Configuration object, initialized with the factory defaults*/
var gConfig={
	name: "none",
	listenPort: 8081,
	managerRefreshMsec: 500,
	//...
	//...
};
var gConfigDefaults;
 
/** Manager object containing the logics*/
var gManager;

/** daemon state*/
var gState={
};


 /**
  * Save the gConfig configuration in config.json
  * */
function saveConfig(){
	var data = JSON.stringify(gConfig);
	fs.writeFile(__dirname+'/config.json', data, function(err) {
		if(err) 
		{
			console.error('Error saving config file.');
			console.error(err.message);
		}
		else
		{
			console.log('Configuration saved successfully.');

		}
	});		
	
	return true;
}

/**
 * Update the status and invoke the scheduler
 * */
function mainRoutine(){	
	
	//example
	//mainFunction();

}

/**
 * Initialize the webserver and the REST API. It serves statically /public
 * */
function initWebServer(){
	//
	// I create the HTTP server and servo / public	
	var webServer = express();
	webServer.use(express.static(__dirname + '/public'));		

	// -----------------
	// API REST
	// -----------------

	//
	// Req /state
	// return the state
	webServer.get("/state", function(req, res) {
		var response={};
		response.rsp="ok";
		res.send(JSON.stringify(response));
	});

	//
	// Req /params[?<field>:<value>]
	// @params parameters, not mandatory, like the fields of the config object. 
	//     field can take the form of sub-attributes (i.e. object.attr.subattr)
	// @return config contents
	webServer.get("/params", function(req, res) {
		/**
		 * Sets a value of nested key string descriptor inside a Object.
		 * It changes the passed object.
		 * Ex:
		 *    let obj = {a: {b:{c:'initial'}}}
		 *    setNestedKey(obj, ['a', 'b', 'c'], 'changed-value')
		 *    assert(obj === {a: {b:{c:'changed-value'}}})
		 *
		 * @param {[Object]} obj   Object to set the nested key
		 * @param {[Array]} path  An array to describe the path(Ex: ['a', 'b', 'c'])
		 * @param {[Object]} value Any value
		 */
		function setNestedKey(obj, path, value){
		  if (path.length === 1) {
			obj[path] = value
			return
		  }
		  return setNestedKey(obj[path[0]], path.slice(1), value)
		}
		
		var saveConfigFlag=false;
		
		for(var queryKey in req.query)
			try
			{
				if(isNaN(req.query[queryKey]))
					// if it a string
					setNestedKey(gConfig,queryKey.split("."),req.query[queryKey]);
				else
					// if not, convert to int
					setNestedKey(gConfig,queryKey.split("."),Number(req.query[queryKey]));
					
				saveConfigFlag=true;
			}
			catch(err)
			{
				console.log("Config key "+queryKey+ " unknown");
			}									
			

		if(saveConfigFlag)
			saveConfig();
			
		var response=gConfig;
		response.rsp="ok";
		res.send(JSON.stringify(response));
	});

	//
	// Req: /upgrade
	// Update the nodejs application. The upgrade file must be a
	// tar.bz2 and all the content of the app must not be contained in sub-folders.
	webServer.use(fileUpload());
	webServer.post("/upgrade", function(req, res){		
			
		// Check that the type is correct
		try{
			if(!req.files.upgradeFileInput.name.endsWith(".tar.bz2"))
			{
				// File sbagliato, non e' un tar.bz2
				console.error("Wrong upgrade file type");
				res.send("<html><head><title>Upgrade</title></head><body style='background: #303030; color: #f0f0f0;'><h2>ERROR</h2><hr/><p>Wrong file type</p></body></html>");
				//JSON.stringify({"rsp":"err", "desc": "Wrong file type"}));		
				return;
			}
		}
		catch(err){
			console.error("Upgrade file error: wrong input field file name" + JSON.stringify(err));
			res.send("<html><head><title>Upgrade</title></head><body style='background: #303030; color: #f0f0f0;'><h2>ERROR</h2><hr/><p>Wrong input field file name</p></body></html>");			
			return;
		}
				
		let upgradeFile = req.files.upgradeFileInput;			
		upgradeFile.mv("/tmp/nodejsapp-upgrade.tar.bz2",function(err){
			if(err)
			{
				// File copy error
				console.error("Upgrade file error: " + JSON.stringify(err));
				res.send("<html><head><title>Upgrade</title></head><body style='background: #303030; color: #f0f0f0;'><h2>ERROR</h2><hr/><p>Error moving file</p></body></html>");
			}
			else
			{	
				var cmd=require('node-cmd');				
				// I'm looking for json package
				cmd.get("rm -f /tmp/package.json ; tar -xvjf /tmp/nodejsapp-upgrade.tar.bz2 -C /tmp package.json", function(err, data, stderr){
					// get the version
					try {
						let appName = JSON.parse(fs.readFileSync(__dirname+'/package.json', 'utf8')).name;
						let newName = JSON.parse(fs.readFileSync('/tmp/package.json', 'utf8')).name;
						if(appName == newName)
						{
							cmd.get("tar -xvjf /tmp/nodejsapp-upgrade.tar.bz2 -C "+ __dirname, function(err, data, stderr){
								if(err)
								{
									console.error("Upgrade error: " + stderr);
									res.send("<html><head><title>Upgrade</title></head><body style='background: #303030; color: #f0f0f0;'><h2>ERROR</h2><hr/><p>Error overwriting nodejsapp</p></body></html>");
								}
								else
								{
									// I run if the extra update script is present
									cmd.get("/bin/sh "+__dirname+"/upgrade-extra.sh", function(err, data, stderr){
										if(err)
										{
											console.error("Upgrade error: " + stderr);
											res.send("<html><head><title>Upgrade</title></head><body style='background: #303030; color: #f0f0f0;'><h2>ERROR</h2><hr/><p>Error executing upgrade script</p></body></html>");
										}
										else
										{										
											console.log("Application succefull upgraded");
											res.send("<html><head><title>Upgrade</title></head><body style='background: #303030; color: #f0f0f0;'><h2>DONE</h2><hr/><p>Please, restart the system.</p></body></html>");
										}
									});			
								}
							});								
						}
						else
						{
							console.error("Upgrade file error: package's name different");
							res.send("<html><head><title>Upgrade</title></head><body style='background: #303030; color: #f0f0f0;'><h2>ERROR</h2><hr/><p>Wrong nodejs app name</p></body></html>");
						}																		
					}
					catch(err) {
						console.error("Upgrade file error: " + JSON.stringify(err));
						res.send("<html><head><title>Upgrade</title></head><body style='background: #303030; color: #f0f0f0;'><h2>ERROR</h2><hr/><p>Error parsing package.json</p></body></html>");
					}					
				});										
			}
		}); // Move end			
	});
	
	//
	// Req: /log
	// Reset the configuration
	webServer.get("/log", function(req, res){
		console.log("Creating log tarball");
		console.log(JSON.stringify(req));
		
		var cmd=require('node-cmd');			
		cmd.get('tar -cvzf /tmp/'+gConfig.name +'logs.tar.gz -C $HOME/.pm2/logs/ ./main-*.log',function(err,data,stderr){
			if(!err)
			{
				res.download('/tmp/'+gConfig.name +'logs.tar.gz');
			}
			else
			{
				console.error("Creating log tarball");
				// Riporto Internal server error
				res.status(500).end();
			}
		});
	});
	
	//
	// Req: /restart
	// restart the device (linux command)
	webServer.get("/restart", function(req, res){
		console.log("Restart the system");

		var cmd=require('node-cmd');			
		cmd.run('/sbin/shutdown -r now');	
		res.send(JSON.stringify({"rsp":"ok"}));
	});


	//
	// Req: /resetConfig
	// reset configuration
	webServer.get("/resetConfig", function(req, res){
		gConfig=JSON.parse(JSON.stringify(gConfigDefaults));
		saveConfig();
		
		var response=gConfig;
		res.send(JSON.stringify({"rsp":"ok"}));
	});

	
	//...
	//...
	//...
	
	webServer.listen(8081,"127.0.0.1");
}

/**
 * Handler of demon exit signals (exit code -2000 reserved)
 * */
function exitHandler(options, err) {
	if(err != -2000)
	{
		gManager.stop();
			
		console.log(err);
		console.log("EXIT");
		
		// I set the actual exit
		setTimeout(function(){ process.exit(-2000); }, 1200);
	}
}


// ------------------------
// Main
// ------------------------
// get the configuration from file
try {
	var data = fs.readFileSync(__dirname+'/config.json');
	gConfigDefaults=JSON.parse(JSON.stringify(gConfig));

	gConfig = JSON.parse(data);
}
catch (err) {
	saveConfig();
	console.log("Error reading config file; using defaults.");
}
console.log(JSON.stringify(gConfig));


// record the closing part
process.stdin.resume();
process.on('exit', exitHandler.bind(null,{}));
process.on('SIGINT', exitHandler.bind(null, {}));
process.on('SIGUSR1', exitHandler.bind(null, {}));
process.on('SIGUSR2', exitHandler.bind(null, {}));
process.on('uncaughtException', exitHandler.bind(null, {}));


// initialize webserver
gManager=new mng.Manager(gConfig);
if(!gManager.init()){
	console.log("Error init manager");
	exit(-1);
}
// initialize web interface
initWebServer();


// run the app
console.log("Starting Nodejs template, ver: "+ gAppVersion);
gManager.start();


setInterval(mainRoutine, 500);
