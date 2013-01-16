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
	        
	
	        /**
	         * Send a message
	         *
	         * @param message The message to dispatch
	         * @param scopes The scopes to dispatch the message in. Defaults to null meaning all scopes
	         * @param identifier Unique identifier for the message within the namespace. Defaults a String representing the object type of the message
	         * @param namespace Namespace which the identifier is unique in. Defaults to the URI of the current page. 
	         */
	        this.send = function(message, scopes, identifier, namespace)
	        {
	            if (!scopes)
	            {
	                scopes = ['global'];
	            }
	            else if (!Array.isArray(scopes))
	            {
	                scopes = [scopes];
	            }
	
	            if (!identifier)
	            	identifier = getObjectType(message);
	            
	            if (!namespace)
	            	namespace = getCurrentURI();
	            
	            scopes.forEach(function(scope){
	                scopedDispatch(message, scope, identifier, namespace);
	            });

	        	sendEnvelope(managedObject, new Envelope(message, scopes));	
	        }
	
	
	        /**
	         * Receive messages
	         * 
	         * @param callBack Function to call when a matching message is received
	         * @param scopes The scopes to match the message by. Defaults to null meaning all scopes
	         * @param identifier Unique identifier to match the message by within the namespace. Defaults to null meaning any identifier
	         * @param namespace Namespace which the identifier is unique in. Defaults to null meaning any Namespace 
	         */
	        this.receive = function(callBack, scopes, identifier, namespace)
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
	                addListenerToScope(scope, callBack, identifier, namespace);
	            });
	        }
	
	
	      
	        /**
	         * Publishes an object's property so that changes are sent to Subscribers
	         * 
	         * @param object Host object of the property
	         * @param propertyNamee Property to publish. Will be modified to call MessageBus.publishValue()
	         * @param scopes The scopes to dispatch the property in. Defaults to null meaning all scopes
	         * @param identifier Unique identifier for the property within the namespace. Defaults a String representing the object type of the message
	         * @param namespace Namespace which the identifier is unique in. Defaults to the URI of the current page.  
	         */
	        this.publish = function(object, propertyName, scopes, identifier, namespace)
	        {
	        	info = Object.getOwnPropertyDescriptor(object, propertyName);
	        }
	        
	        
	        /**
	         * Publishes an object's property so that changes are sent to Subscribers
	         * 
	         * @param object Object to send to Subscribers
	         * @param scopes The scopes to dispatch the object in. Defaults to null meaning all scopes
	         * @param identifier Unique identifier for the object within the namespace. Defaults a String representing the object type of the message
	         * @param namespace Namespace which the identifier is unique in. Defaults to the URI of the current page.  
	         */
	        this.publishValue = function(object, scopes, identifier, namespace)
	        {
	        	
	        }
	        

	        /**
	         * Subscribes to a published object's property.
	         * 
	         * @param object Host object of the property
	         * @param propertyName property to set when changes are received
	         * @param scopes The scopes to match the property by. Defaults to null meaning all scopes
	         * @param identifier Unique identifier to match the property by within the namespace. Defaults to null meaning any identifier
	         * @param namespace Namespace which the identifier is unique in. Defaults to null meaning any Namespace 
	         */	
	        this.subscribe = function(object, propertyName, scopes, identifier, namespace)
	        {
        	
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
	        var scopedDispatch = function(message, scope, identifier, namespace)
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
	        var addListenerToScope = function(scope, callBack, identifier, namespace)
	        {
	            // Auto register the scope
	            scopedListeners.addScope(scope);
	
	            var listeners = scopedListeners.getListeners(scope);
	
	            //var key = 
	            
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
	        
	        
	        var getCurrentURI = function()
	        {
	        	return location.protocal+'//'+location.host+location.pathname;
	        }
	        
	        
	        var getObjectType = function(obj)
	        {
	        	if (obj && obj.constructor && obj.constructor.toString) 
	        	{
	                var result = obj.constructor.toString().match(/function\s*(\w+)/);

	                if (result && result.length == 2)
	                    return result[1];
	            }

	            return undefined;
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
        var Envelope = function(msg, scopes, type, identifier, namespace)
        {
        	this.type = type || 'MESSAGE';
        	this.scopes = scopes || ['global'];
        	this.msg = msg || {};
        	this.identifer = identifier;
        	this.namespace = namespace;
        	this.originUid = '';
        }
        
        
        // Add to global namespace
        global.MessageBus = new MessageBus(global);
    }


})(typeof window !== 'undefined' ? window : self);

