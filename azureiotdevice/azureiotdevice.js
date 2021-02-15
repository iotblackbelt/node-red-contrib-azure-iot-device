
// Copyright (c) Eric van Uum. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
'use strict'

var Client = require('azure-iot-device').Client;
var Message = require('azure-iot-device').Message;
var NoRetry = require('azure-iot-common').NoRetry;

// Only AMQP(WS) or MQTT(WS) used as protocol, no HTTP support
var Protocols = {
    amqp: require('azure-iot-device-amqp').Amqp,
    amqpWs: require('azure-iot-device-amqp').AmqpWs,
    mqtt: require('azure-iot-device-mqtt').Mqtt,
    mqttWs: require('azure-iot-device-mqtt').MqttWs
};

// Only AMQP(WS) or MQTT(WS) used as protocol, no HTTP support
var ProvisioningProtocols = {
    amqp: require('azure-iot-provisioning-device-amqp').Amqp,
    amqpWs: require('azure-iot-provisioning-device-amqp').AmqpWs,
    mqtt: require('azure-iot-provisioning-device-mqtt').Mqtt,
    mqttWs: require('azure-iot-provisioning-device-mqtt').MqttWs
};

var SecurityClient = {
    x509: require('azure-iot-security-x509').X509Security,
    sas: require('azure-iot-security-symmetric-key').SymmetricKeySecurityClient
};

var ProvisioningDeviceClient = require('azure-iot-provisioning-device').ProvisioningDeviceClient;
var GlobalProvisoningEndpoint = "global.azure-devices-provisioning.net";

var crypto = require('crypto');

var client = null;
var twin = null;

/**
 * The "azure-iot-device" node enables you to represent an Azure IoT Device in Node-Red.
 * The node provide connecting a device using connection string and DPS
 * You can use a full connection string, a SAS key and a X.509 attestation
 * 
 * The device node enables D2C, C2D messages, Direct Methods, Desired and Reported properties.
 * You can connect to IoT Edge as a downstream device, IoT Hub and IoT Central.
 */
module.exports = function (RED) {

    const { config } = require('process');

    var statusEnum = {
        connected: { fill: "green", shape:"dot", text: "Connected" },
        connecting: { fill: "blue", shape:"dot", text: "Connecting" },
        provisioning: { fill: "blue", shape:"dot", text: "Provisioning" },
        disconnected: { fill: "red", shape:"dot", text: "Disconnected" },
        error: { fill: "grey", shape:"dot", text: "Error" }
    };

    // Array to hold the direct method responses
    var methodResponses = [];

    // Setup node-red node to represent Azure IoT Device
    function AzureIoTDevice(config) {
        // Store node for further use
        var node = this;
        node.deviceid = config.deviceid;
        node.pnpModelid = config.pnpModelid;
        node.connectiontype = config.connectiontype;
        node.authenticationmethod = config.authenticationmethod;
        node.enrollmenttype = config.enrollmenttype;
        node.iothub = config.iothub;
        node.isIotcentral = config.isIotcentral;
        node.scopeid = config.scopeid;
        node.saskey = config.saskey;
        node.protocol = config.protocol;
        node.retryInterval = config.retryInterval;
        node.methods = config.methods;
        node.DPSpayload = config.DPSpayload;
        node.gatewayHostname = config.gatewayHostname;
        node.cert = config.cert;
        node.key = config.key;
        node.ca = config.ca;

        // Create the Node-RED node
        RED.nodes.createNode(node, config);
        setStatus(node, statusEnum.disconnected);
        
        // Initiate
        initiateDevice(node);
    };

    // Set status of node on node-red
    var setStatus = function (node, status) {
        node.status({ fill: status.fill, shape: status.shape, text: status.text });
    };

    // Compute device SAS key
    function computeDerivedSymmetricKey(masterKey, regId) {
        return crypto.createHmac('SHA256', Buffer.from(masterKey, 'base64'))
            .update(regId, 'utf8')
            .digest('base64');
    };
    
    // Close all listeners
    function closeAll(node) {
        node.log(node.deviceid + ' -> Closing all clients.');
        try {
            twin.removeAllListeners();
            twin = null;
        } catch (err) {
            twin = null;
        }
        try {
            client.removeAllListeners();
            client.close((err,result) => {
                if (err) {
                    node.log(node.deviceid + ' -> Azure IoT Device Client close failed: ' + JSON.stringify(err));
                } else {
                    node.log(node.deviceid + ' -> Azure IoT Device Client closed.');
                }
            });
            client = null;
        } catch (err) {
            client = null;
        }
    };

    // Initiate provisioning and retry if network not available.
    function initiateDevice(node) {
        // Provision device
        provisionDevice(node).then( function(result) {
            if (result) {
                // Connect device to Azure IoT
                connectDevice(node, result).then( function(result) {
                    // Get the twin, throw error if it fails
                    retrieveTwin(node).catch(err => {
                        node.error(node.deviceid + ' -> Device connection failed:' + JSON.stringify(err));
                        throw new Error(err);
                    });
                }).catch( function(err) {
                    node.error(node.deviceid + ' -> Device connection failed:' + JSON.stringify(err));
                    throw new Error(err);
                });
            } else {
                node.log(node.deviceid + ' -> Retry provisioning after ' + node.retryInterval + ' seconds.');
                setTimeout(() => {
                    initiateDevice(node);
                }, node.retryInterval * 1000);
            }
        }).catch( function(err) {
            node.error(node.deviceid + ' -> Device provisioning failed:' + JSON.stringify(err));
        });
    };

    // Provision the client 
    function provisionDevice(node) {
        // Set status
        setStatus(node, statusEnum.provisioning);
            
        // Return a promise to enable retry
        return new Promise((resolve,reject) => {
            // Log the start
            node.log(node.deviceid + ' -> Initiate IoT Device settings.');

            // Set the security properties
            var options = {};
            if (node.authenticationmethod === "x509") {
                options = {
                    cert : node.cert,
                    key : node.key
                };
            };

            // Set provisioning protocol to selected (default to AMQP-WS)
            var provisioningProtocol = (node.protocol === "amqp") ? ProvisioningProtocols.amqp : 
                (node.protocol === "amqpWs") ? ProvisioningProtocols.amqpWs :
                (node.protocol === "mqtt") ? ProvisioningProtocols.mqtt :
                (node.protocol === "mqttWs") ? ProvisioningProtocols.mqttWs :
                ProvisioningProtocols.amqpWs;

            // Set security client based on SAS or X.509
            var saskey = (node.enrollmenttype === "group") ? computeDerivedSymmetricKey(node.saskey, node.deviceid) : node.saskey;
            var provisioningSecurityClient = 
                (node.authenticationmethod === "sas") ? new SecurityClient.sas(node.deviceid, saskey) :
                    new SecurityClient.x509(node.deviceid, options);

            // Create provisioning client
            var provisioningClient = ProvisioningDeviceClient.create(GlobalProvisoningEndpoint, node.scopeid, new provisioningProtocol(), provisioningSecurityClient);

            // set the provisioning payload (for custom allocation)
            var payload = {};
            if (node.DPSpayload) {
                // Turn payload into JSON
                try {
                    payload = JSON.parse(node.DPSpayload);
                    node.log(node.deviceid + ' -> DPS Payload added.');
                } catch (err) {
                    // do nothing 
                }
            }
            
            // Register the device.
            node.log(node.deviceid + ' -> Provision IoT Device using DPS.');
            if (node.connectiontype === "constr") {
                resolve(options);
            } else {
                provisioningClient.setProvisioningPayload(JSON.stringify(payload));
                provisioningClient.register().then( function(result) {
                    // Process provisioning details
                    node.log(node.deviceid + ' -> Registration succeeded.');
                    node.log(node.deviceid + ' -> Assigned hub: ' + result.assignedHub);
                    var msg = {};
                    msg.topic = 'provisioning';
                    msg.deviceId = result.deviceId;
                    msg.payload = JSON.parse(JSON.stringify(result));
                    node.send(msg);
                    node.iothub = result.assignedHub;
                    node.deviceid = result.deviceId;
                    setStatus(node, statusEnum.disconnected);
                    resolve(options);
                }).catch( function(err) {
                    // Handle error
                    setStatus(node, statusEnum.error);
                    reject(err);
                });
            }
        });
    }

    // Initiate an IoT device node in node-red
    function connectDevice(node, options){
        // Set status
        setStatus(node, statusEnum.connecting);

        // Set provisioning protocol to selected (default to AMQP-WS)
        var deviceProtocol = (node.protocol === "amqp") ? Protocols.amqp : 
        (node.protocol === "amqpWs") ? Protocols.amqpWs :
        (node.protocol === "mqtt") ? Protocols.mqtt :
        (node.protocol === "mqttWs") ? Protocols.mqttWs :
        Protocols.amqpWs;
        // Set the client connection string and options
        var connectionString = 'HostName=' + node.iothub + ';DeviceId=' + node.deviceid;
        // Finalize the connection string
        connectionString = connectionString + ((node.authenticationmethod === 'sas') ? (';SharedAccessKey=' + computeDerivedSymmetricKey(node.saskey, node.deviceid)) : ';x509=true');
        
        // Update options
        if (node.gatewayHostname !== "") {
            node.log(node.deviceid + ' -> Connect through gateway: ' + node.gatewayHostname);
            try {
                options.ca = node.ca;
                connectionString = connectionString + ';GatewayHostName=' + node.gatewayHostname;
            } catch (err){
                node.error(node.deviceid + ' -> Certificate file error: ' + err);
                setStatus(node, statusEnum.error);
            };
        }

        // Define the client
        node.log(node.deviceid + ' -> Connection string: ' + connectionString);
        client = Client.fromConnectionString(connectionString, deviceProtocol);

        // Add pnp modelid to options
        if (node.pnpModelid) {
            options.modelId = node.pnpModelid;
            node.log(node.deviceid + ' -> Set PnP Model ID: ' + node.pnpModelid);
        }

        // Ensure resources are reset
        node.on('close', function(done) {
            closeAll(node);
            done();
        });

        // Listen to node input to send telemetry or reported properties
        node.on('input', function (msg) {
            if (typeof (msg.payload) === "string") {
                //Converting string to JSON Object
                msg.payload = JSON.parse(msg.payload);
            }
            if (msg.topic === 'telemetry') {
                sendDeviceTelemetry(node, client, msg.payload, msg.properties);
            } else if (msg.topic === 'property' && deviceTwin) {
                sendDeviceProperties(node, deviceTwin, msg.payload);
            } else if (msg.topic === 'response') { 
                node.log(node.deviceid + ' -> Method response received with id: ' + msg.payload.requestId);
                sendMethodResponse(node, msg.payload)
            } else {
                node.error(node.deviceid + ' -> Incorrect input. Must be of type \"telemetry\" or \"property\" or \"response\".');
            }
        });

        // React or errors
        client.on('error', function (err) {
            node.error(node.deviceid + ' -> Device Client error: ' + JSON.stringify(err));
            setStatus(node, statusEnum.error);
        });

        // React on disconnect and try to reconnect
        client.on('disconnect', function (err) {
            node.error(node.deviceid + ' -> Device Client disconnected: ' + JSON.stringify(err));
            setStatus(node, statusEnum.disconnected);
            closeAll(node);
            initiateDevice(node);
        });

        // Listen to commands for defined direct methods
        for (let method in node.methods) {
            node.log(node.deviceid + ' -> Adding synchronous command: ' + node.methods[method].name);
            var mthd = node.methods[method].name;
            // Define the method on the client
            client.onDeviceMethod(mthd, function(request, response) {
                node.log(node.deviceid + ' -> Command received: ' + request.methodName);
                node.log(node.deviceid + ' -> Command payload: ' + JSON.stringify(request.payload));
                node.send({payload: request, topic: "command", deviceId: node.deviceid});

                // Now wait for the response
                getResponse(node, request.requestId).then( function(rspns){
                    node.log(node.deviceid + ' -> Method response status: ' + rspns.status);
                    node.log(node.deviceid + ' -> Method response payload: ' + JSON.stringify(rspns.payload));
                    response.send(rspns.status, rspns.payload, function(err) {
                        if (err) {
                        node.log(node.deviceid + ' -> Failed sending method response: ' + err);
                        } else {
                        node.log(node.deviceid + ' -> Successfully sent method response: ' + request.methodName);
                        }
                    });
                })
                .catch( function(err){
                    node.error(node.deviceid + ' -> Failed sending method response: \"' + request.methodName + '\", error: ' + err);
                });
            });
        };

        // Start listening to C2D messages
        node.log(node.deviceid + ' -> Listening to C2D messages');
        // Define the message listener
        client.on('message', function (msg) {
            node.log(node.deviceid + ' -> C2D message received, data: ' + msg.data);
            var message = {
                messageId: msg.messageId,
                data: msg.data.toString('utf8'),
                properties: msg.properties
            };
            node.send({payload: message, topic: "message", deviceId: node.deviceid});
            client.complete(msg, function (err) {
                if (err) {
                    node.error(node.deviceid + ' -> C2D Message complete error: ' + err);
                } else {
                    node.log(node.deviceid + ' -> C2D Message completed.');
                }
            });
        });

        // Set the no retry option
        var noretry = new NoRetry();
        client.setRetryPolicy(noretry);

        // Set the options first and then open the connection
        return new Promise((resolve,reject) => {
            client.setOptions(options).then( function() {
                client.open().then( function() {
                    node.log(node.deviceid + ' -> Device client connected.');
                    setStatus(node, statusEnum.connected);
                    resolve(client);
                }).catch( function(err) {
                    node.log(node.deviceid + ' -> Client connection error: ' + err);
                    setStatus(node, statusEnum.error);
                    reject(err);
                });
            }).catch( function(err) {
                node.log(node.deviceid + ' -> Client connection error: ' + err);
                setStatus(node, statusEnum.error);
                reject(err);
            });
        })
    };

    // Get the device twin 
    function retrieveTwin(node){
        // Set the options first and then open the connection
        node.log(node.deviceid + ' -> Retrieve device twin.');
        return new Promise((resolve,reject) => {
            client.getTwin().then(result => {
                node.log(node.deviceid + ' -> Device twin created.');
                twin = result;
                node.log(node.deviceid + ' -> Twin contents: ' + JSON.stringify(twin.properties));
                // Send the twin properties to Node Red
                var msg = {};
                msg.topic = 'property';
                msg.deviceId = node.deviceid;
                msg.payload = JSON.parse(JSON.stringify(twin.properties));
                node.send(msg);
                
                // Get the desired properties
                twin.on('properties.desired', function(payload) {
                    node.log(node.deviceid + ' -> Desired properties received: ' + JSON.stringify(payload));
                    var msg = {};
                    msg.topic = 'property';
                    msg.deviceId = node.deviceid;
                    msg.payload = payload;
                    node.send(msg);
                    // Report back received desired properties ** Only for IoT Central Devices **
                    if (node.isIotcentral) {
                        for (let setting in payload){
                            if (setting.indexOf('$') === -1) {
                                var patch = {
                                    [setting]: {
                                        value: payload[setting].value,
                                        status: 'completed',
                                        desiredVersion: payload.$version,
                                        message: 'Node-Red Azure IoT Device'
                                    }
                                }
                                sendDeviceProperties(node, twin, patch);
                            }
                        }
                    }
                });
            }).catch(err => {
                node.error(node.deviceid + ' -> Device twin retrieve failed:' + JSON.stringify(err));
                reject(err);
            });
        })
    };

    // Send messages to IoT platform (Transparant Edge, IoT Hub, IoT Central)
    function sendDeviceTelemetry(node, client, message, properties) {
        if (validateMessage(message)){
            if (message.timestamp && isNaN(Date.parse(message.timestamp))) {
                node.error(node.deviceid + ' -> Invalid telemetry format: if present, timestamp must be in ISO format (e.g., YYYY-MM-DDTHH:mm:ss.sssZ)');
            } else {
                // Create message and set encoding and type
                var msg = new Message(JSON.stringify(message));
                // Check if properties set and add if so
                if (properties){
                    for (let property in properties) {
                        msg.properties.add(properties[property].key, properties[property].value);
                    }
                }
                msg.contentEncoding = 'utf-8';
                msg.contentType = 'application/json';
                // Send the message
                if (client) {
                    client.sendEvent(msg, function(err, res) {
                        if(err) {
                            node.error(node.deviceid + ' -> An error ocurred when sending telemetry: ' + err);
                            setStatus(node, statusEnum.error);
                        } else {
                            node.log(node.deviceid + ' -> Telemetry sent: ' + JSON.stringify(message));
                            setStatus(node, statusEnum.connected);
                        }
                    });      
                } else {
                    node.error(node.deviceid + ' -> Unable to send telemetry, device not connected.');
                    setStatus(node, statusEnum.error);
                }   
            }            
        } else {
            node.error(node.deviceid + ' -> Invalid telemetry format.');
        }
    };

    
    // Send device reported properties.
    function sendDeviceProperties(node, twin, properties) {
        if (twin) {
            twin.properties.reported.update(properties, function (err) {
                if (err) {
                    node.error(node.deviceid + ' -> Sending device properties failed: ' + err);
                    setStatus(node, statusEnum.error);
                } else {
                    node.log(node.deviceid + ' -> Device properties sent: ' + JSON.stringify(properties));
                    setStatus(node, statusEnum.connected);
                }
            });
        }
        else {
            node.error(node.deviceid + ' -> Unable to send device properties, device not connected.');
        }
    };

    // Send device direct method response.
    function sendMethodResponse(node, methodResponse) {
        // Push the reponse to the array
        node.log(node.deviceid + ' -> Creating response for command: ' + methodResponse.methodName);
        methodResponses.push(
            {requestId: methodResponse.requestId, response: methodResponse}
        );
    };

    // Get method response using promise, and retry, and slow backoff
    function getResponse(node, requestId){
        var retries = 20;
        var timeOut = 1000;
        // Retrieve client using progressive promise to wait for method response
        var promise = Promise.reject();
        for(var i=1; i <= retries; i++) {
            promise = promise.catch( function() {
                    var methodResponse = methodResponses.find(function(m){return m.requestId === requestId});
                    if (methodResponse){
                        // get the response and clean the array
                        methodResponses.splice(methodResponses.findIndex(function(m){return m.requestId === requestId}),1);
                        return methodResponse.response;
                    }
                    else {
                        throw new Error(node.deviceid + ' -> Method Response not received..');
                    }
                })
                .catch(function rejectDelay(reason) {
                    return new Promise(function(resolve, reject) {
                        setTimeout(reject.bind(null, reason), timeOut * ((i % 10) + 1));
                    });
                });
        }
        return promise;
    };

    // @returns true if message object is valid, i.e., a map of field names to numbers, strings and booleans.
    function validateMessage(message) {
        if (!message || typeof message !== 'object') {
            return false;
        }
        for (let field in message) {
            if (typeof message[field] !== 'number' && typeof message[field] !== 'string' && typeof message[field] !== 'boolean') {
                if (typeof message[field] === 'object')
                {
                    validateMessage(message[field]);
                }
                else {
                    return false;
                }
            }
        }
        return true;
    };

    // Registration of the node into Node-RED
    RED.nodes.registerType("azureiotdevice", AzureIoTDevice, {
        defaults: {
            deviceid: {value: ""},
            pnpModelid: {value: ""},
            connectiontype: {value: ""},
            authenticationmethod: {value: ""},
            enrollmenttype: {value: ""},
            iothub: {value: ""},
            isIotcentral: {value: false},
            scopeid: {value: ""},
            saskey: {value: ""},
            certname: {value: ""},
            keyname: {value: ""},
            protocol: {value: ""},
            retryInterval: {value: 30},
            methods: {value: []},
            DPSpayload: {value: ""},
            isDownstream: {value: false},
            gatewayHostname: {value: ""},
            caname: {value:""},
            cert: {type:"text"},
            key: {type:"text"},
            ca: {type:"text"}
        }
    });

}
