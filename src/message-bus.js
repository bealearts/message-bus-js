/**
 * Message Bus for application/page/frame/component/worker communication
 */
(function(global)
{

    "use strict";

    if (!global.MessageBus)
    {
        
    	/**
    	 * Message Bus 
         *
		 * @param object The containing application/page/frame/component/worker object
    	 */
    	var MessageBus = function(object)
        {

	        /* PUBLIC */
	
	        /**
	         * Is this the top level Message Bus
	         */
	        this.isTopLevelBus = false;
	
	       
	        
	        
	        /**
	         * Register a web worker object with the Bus
	         * As well as registering themselves, their parent window object must register them too
	         * 
	         * Suggested use <code>var worker = MessageBus.registerWorker( new Worker(...) );</code> to avoid possible missed messages
	         */
	        this.registerWorker = function(worker)
	        {	        	
	        	worker.addEventListener('message', onWorkerMessage);
	        	
	        	var tempUid = generateUid(); 
	        	childManagedObjects[tempUid] = worker;
	        	
	        	sendEnvelope(worker, new Envelope(tempUid, [], 'REGISTER_PARENT'));
	        	
	        	return worker;
	        }
	        
	
	
	        /**
	         * Send a message
	         *
	         * @param message The message to dispatch
	         * @param scopes The scopes to dispatch the message in, defaults to null meaning all scopes
	         */
	        this.send = function(message, scopes)
	        {
	            if (!scopes)
	            {
	                scopes = ['global'];
	            }
	            else if (!Array.isArray(scopes))
	            {
	                scopes = [scopes];
	            }
	
	            scopes.forEach(function(scope){
	                scopedDispatch(message, scope);
	            });

	        	sendEnvelope(managedObject, new Envelope(message, scopes));	
	        }
	
	
	        /**
	         * Receive messages
	         */
	        this.receive = function(callBack, scopes)
	        {
	            if (!scopes)
	            {
	                scopes = ['global'];
	            }
	            else if (!Array.isArray(scopes))
	            {
	                scopes = [scopes];
	            }
	
	            scopes.forEach(function(scope){
	                addListenerToScope(scope, callBack);
	            });
	        }
	
	
	        
	        /**
	         * Set the allowed origin URIs
	         * 
	         * <p></p>
	         */
	        this.setAllowedOrigins = function(originURIs)
	        {
	            if (!originURIs)
	            {
	            	originURIs = [];
	            }
	            else if (!Array.isArray(originURIs))
	            {
	            	originURIs = [originURIs];
	            }
	        }
	        
	        
	        
	
	        /* PRIVATE */
		                
	        
	        var scopedListeners = new ScopedListeners();
	
	        var managedObject;
	        
	        var managedObjectParent;
	        
	        var childManagedObjects = {};
	        
	        var uid = '';
	        
	        
	        
	        /**
	         * Register an application/page/frame/component/worker object with the Bus
	         */
	        var register = function(object, caller)
	        {            
	            managedObject = object;
	            uid = generateUid();
	            
	            // Add listener
	            if (managedObject.parent)
	            	managedObject.addEventListener("message", onWindowMessage);	
	            else
	            	managedObject.addEventListener("message", onWorkerMessage);
	        	
	            
	        	// Set parent
	        	if (managedObject.parent)
	        		managedObjectParent = managedObject.parent;
	        	
	            // is this the top level Message Bus
	        	if (managedObject.parent && (managedObject !== managedObject.parent))
	        		caller.isTopLevelBus = false;
	        	else
	        		caller.isTopLevelBus = true;	        	
	        	
	        	
	        	// if not top level bus and not a worker, dispatch register child message type
	        	if (!caller.isTopLevelBus && managedObject.parent)
	        	{            	
	            	sendEnvelope(managedObjectParent, new Envelope(uid, [], 'REGISTER_CHILD'));
	        	}
	        	
	        }
	        
	        
	        
	        /**
	         * Send a message envelope though the native messaging
	         */
	        var sendEnvelope = function(target, envelope)
	        {
    			//console.log('sendEnvelope:', envelope.origin, envelope.msg);
	        	envelope.originUid = uid;
	        	
	        	var envelopeJSON = JSON.stringify(envelope);
	        	target.postMessage(envelopeJSON, '*');
	        }
	        
	        
	
	        /**
	         * Dispatch to a scope
	         *
	         * @param message
	         * @param scope
	         */
	        var scopedDispatch = function(message, scope)
	        {
	            // Auto register the scope
	            scopedListeners.addScope(scope);
	
	
	            scopedListeners.getListeners(scope).forEach(function(listener){
	                // Call the listener with the message and optional scope
	                listener(message, scope);
	            });
	        }
	
	
	        /**
	         * Add a listener to a scope
	         *
	         * @param scope
	         * @param callBack
	         */
	        var addListenerToScope = function(scope, callBack)
	        {
	            // Auto register the scope
	            scopedListeners.addScope(scope);
	
	            var listeners = scopedListeners.getListeners(scope);
	
	            if (listeners.indexOf(callBack) === -1)
	            {
	                listeners.push(callBack);
	            }
	        }
	
	
	
	        /**
	         * Handle a native message received from another managed object in the bus, by a window based object
	         */
	        var onWindowMessage = function(event)
	        {	        	
	        	var envelopeJSON = event.data;
	        	var envelope = JSON.parse(envelopeJSON);

	        	if (envelope)
	        	{
	        		// Auto register a child
		        	if (envelope.type === 'REGISTER_CHILD')
		        	{
		        		childManagedObjects[envelope.originUid] = event.source;
		        	}
		        	else
		        	{
		        		//console.log('MessageBus', managedObject.name, envelope.msg, event.source, uid, envelope.originUid);
		        		
		        		if (envelope.originUid !== uid)
		        		{
		        			envelope.scopes.forEach(function(scope){
		    	                scopedDispatch(envelope.msg, scope);
		    	            });
		        		}
    		
		            	// Forward to children
		        		for (var childObjectUid in childManagedObjects)
		            	{
		        			if (childManagedObjects.hasOwnProperty(childObjectUid) && envelope.originUid !== childObjectUid)
		            		{		            			
		            			var childObject = childManagedObjects[childObjectUid];
		            			sendEnvelope(childObject, new Envelope(envelope.msg, envelope.scopes));
		            		}
		            	}
		            	
		            	// Forward to parent
		        		if (managedObjectParent && (managedObjectParent !== managedObject) && event.source !== managedObjectParent)
		        		{		        			
		        			sendEnvelope(managedObjectParent, new Envelope(envelope.msg, envelope.scopes));
		        		}
		        	}
	        	}
	        }
	    
	       
	        
	        /**
	         * Handle a native message received from another managed object in the bus, by a worker based object
	         */
	        var onWorkerMessage = function(event)
	        {	        	
	        	var envelopeJSON = event.data;
	        	var envelope = JSON.parse(envelopeJSON);

	        	if (envelope)
	        	{
	        		// Auto register a parent
		        	if (envelope.type === 'REGISTER_PARENT')
		        	{
		        		// Override worker uid
		        		uid = envelope.msg;
		        	}
		        	else
		        	{
		        		//console.log(event);
		        		
		        		if (envelope.originUid !== uid)
		        		{
		        			envelope.scopes.forEach(function(scope){
		    	                scopedDispatch(envelope.msg, scope);
		    	            });
		        		}
		        			        		
		            	// Forward to children
		            	for (var childObjectUid in childManagedObjects)
		            	{
		            		if (childManagedObjects.hasOwnProperty(childObjectUid) && envelope.originUid !== childObjectUid)
		            		{		            			
		            			var childObject = childManagedObjects[childObjectUid];
		            			sendEnvelope(childObject, new Envelope(envelope.msg, envelope.scopes));
		            		}
		            	}
		        	}

	        	}
	        }
	        
	        
	        
	        /**
	         * Generate a uid for a Bus Node
	         */
	        var generateUid = function() 
	        {
	        	var result, i, j;

	        	result = '';

	        	for(j=0; j<32; j++) 
	        	{
		        	i = Math.floor(Math.random()*16).toString(16).toUpperCase();
		        	result = result + i;
	        	}

	        	return result;
	        }
	        
	        
	        
	        
	        // Register managed object on construction
	        register(object, this);
        }
        
        
        
    	
        /**
         * Declared scopes and their listeners
         */
        var ScopedListeners = function()
        {


            /* PUBLIC */


            this.hasScope = function(scope)
            {
                return scopes.hasOwnProperty(scope);
            }


            this.addScope = function(scope)
            {
                if (!this.hasScope(scope))
                {
                    scopes[scope] = [];
                }
            }


            this.getListeners = function(scope)
            {
                return scopes[scope];
            }



            /* PRIVATE */

            var scopes = {};

            // Main scope
            this.addScope('global');
        }


        
        /**
         * Message Container
         */
        var Envelope = function(msg, scopes, type)
        {
        	this.type = type || 'MESSAGE';
        	this.scopes = scopes || ['global'];
        	this.msg = msg || {};
        	this.originUid = '';
        }
        
        
        // Add to global namespace
        global.MessageBus = new MessageBus(global);
    }


})(typeof window !== 'undefined' ? window : self);

