/*
 * Oggetto manager.
 * 
 * Implements the logic of system operation. Offers calls
 * standard: init, start and stop. The body of the logics is contained in the
 * method _manager.
 * */
 
 /**
  * Keepalive management object
  * */
const keepAliveAgent = require('agentkeepalive');


//
// Manager object
function Manager(params) {
		
	// HTTP request manager with keepalives
	this.mHttpReq= require("axios");
	
	// Axios options for keepalive requests
	this.mHttpReqOpt={httpAgent: new keepAliveAgent({
								  maxSockets: 10,
								  maxFreeSockets: 10,
								  timeout: 60000,
								  freeSocketKeepAliveTimeout: 30000, // free socket keepalive for 30 seconds
								})
	};
	
	this.mState={
		state : "none",
		//...
		//...
	}
	
	this.updateParams(params);
}
	
		

/**
 * main timer manager
 * */
Manager.prototype._manager = function(){
	var self=this;
	
	console.log("Manager");
	switch(self.mState.state)
	{
		case "init":					
		break;
		
		case "idle":
		break;
				
		case "fail":			
		break;
		
		default:
		break;
	}
}

Manager.prototype.init = function(){
	console.log("Inizializzo");

	this.mState.state="init";
	
	// Salvo this in self per usare il riferimento ai ritorni delle richieste.
	var self = this;

	// Example of a keepalive request
/*	self.mHttpReq.get("http://xxx.xxx.xxx.xxx/xxxx",self.mHttpReqOpt)
	.then(function(response){
		
			self.valore=response.data;
		
	}).catch(function(error){console.error("Error"); });	
*/	
	return true;							
};

/**
 * return the status
 * */
Manager.prototype.getState = function(){
		return this.mState;
};

/**
 * run the manager
 * */
Manager.prototype.start = function(){
	// Lancio il timer di gestione
	var self = this;
	self.mState.state="init";
	
	self.mMainTimerFD=setInterval(function(){self._manager();}, self.params.managerRefreshMsec);
}

/**
 * stop the manager
 * */
Manager.prototype.stop = function(){
	var self = this;
	clearTimeout(self.mMainTimerFD);
	this.mState.state="stop";
};

/**
 * Update the configuration parameters. Init parameters
 * */
Manager.prototype.updateParams = function(params){
	this.params=JSON.parse(JSON.stringify(params));
}


// export the object
exports.Manager=Manager;

