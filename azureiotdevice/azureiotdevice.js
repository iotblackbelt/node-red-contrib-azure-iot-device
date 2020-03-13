module.exports = function (RED) {
    'use strict'

    var Client = require('azure-iot-device').Client;
    var Message = require('azure-iot-device').Message;

    var Protocols = {
        amqp: require('azure-iot-device-amqp').Amqp,
        amqpWs: require('azure-iot-device-amqp').AmqpWs,
        mqtt: require('azure-iot-device-mqtt').Mqtt,
        mqttWs: require('azure-iot-device-mqtt').MqttWs
    };

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

    var statusEnum = {
        connected: { fill: "green", shape:"dot", text: "Connected" },
        disconnected: { fill: "red", shape:"dot", text: "Disconnected" },
        error: { fill: "grey", shape:"dot", text: "Error" }
    };

    // Setup config node to represent IoT Edge Gateway
    function IoTEdgeGateway(config) {
        var node = this;
        node.hostname = config.hostname;
        node.certificate = config.certificate;
        RED.nodes.createNode(this, config);
    };

    // Setup node-red node to represent Azure IoT Device
    function AzureIoTDevice(config) {
        // Store node for further use
        var node = this;
        node.deviceid = config.deviceid;
        node.connectiontype = config.connectiontype;
        node.authenticationmethod = config.authenticationmethod;
        node.enrollmenttype = config.enrollmenttype;
        node.iothub = config.iothub;
        node.isIotcentral = config.isIotcentral;
        node.scopeid = config.scopeid;
        node.saskey = config.saskey;
        node.x509certificate = config.x509certificate;
        node.x509key = config.x509key;
        node.protocol = config.protocol;
        node.methods = config.methods;
        node.isDownstream = config.isDownstream;
        node.gateway = config.gateway;

        // Create the Node-RED node
        RED.nodes.createNode(this, config);
        setStatus(node, statusEnum.disconnected);
      
        // Create the device
        initiateDeviceSettings(node);
    };

    // Set status of node on node-red
    var setStatus = function (node, status) {
        node.status({ fill: status.fill, shape: status.shape, text: status.text });
    };

    function computeDerivedSymmetricKey(masterKey, regId) {
    return crypto.createHmac('SHA256', Buffer.from(masterKey, 'base64'))
        .update(regId, 'utf8')
        .digest('base64');
    };

    // Create the device setting and registration
    function initiateDeviceSettings(node) {
        // Log the start
        node.log('Initiate IoT Device settings: ' + node.deviceid);
        // Set device protocol to selected (default to AMQP-WS)
        var deviceProtocol = (node.protocol == "amqp") ? Protocols.amqp : 
            (node.protocol == "amqpWs") ? Protocols.amqpWs : 
            (node.protocol == "mqtt") ? Protocols.mqtt :
            (node.protocol == "mqttWs") ? Protocols.mqttWs : 
            Protocols.amqpWs;
    
        // Set the security properties and finalize the connection string
        var options = {};
        if (node.authenticationmethod === "sas") {
            // Check if group or individual enrollment
            if (node.enrollmenttype === "group") {
                node.saskey = computeDerivedSymmetricKey(node.saskey, node.deviceid);
            }
        } else if (node.authenticationmethod === "x509") {
            options = {
                cert : node.x509certificate,
                key : node.x509key
            };
        };
        
        // Create the client connection string based on the node settings.
        // Either use the provided conectiong string or use DPS to provision.
        node.log('Initiate IoT Device connection string: ' + node.deviceid);
        if (node.connectiontype === "constr") {
            initiateClient(options, deviceProtocol);
        } else if (node.connectiontype === "dps") {
            // Set provisioning protocol to selected (default to AMQP-WS)
            var provisioningProtocol = (node.protocol == "amqp") ? ProvisioningProtocols.amqp : 
                (node.protocol == "amqpWs") ? ProvisioningProtocols.amqpWs :
                (node.protocol == "mqtt") ? ProvisioningProtocols.mqtt :
                (node.protocol == "mqttWs") ? ProvisioningProtocols.mqttWs :
                ProvisioningProtocols.amqpWs;

            // Set security client based on SAS or X.509
            var provisioningSecurityClient = 
                (node.authenticationmethod == "sas") ? new SecurityClient.sas(node.deviceid, node.saskey) :
                new X509Security(node.deviceid, node.x509certificate);

            var provisioningClient = ProvisioningDeviceClient.create(GlobalProvisoningEndpoint, node.scopeid, new provisioningProtocol(), provisioningSecurityClient);
            // Register the device.
            node.log('Provision IoT Device using DPS: ' + node.deviceid);
            provisioningClient.register(function(err, result) {
                if (err) {
                    node.log("Error registering device: " + err);
                } else {
                    node.log('Registration succeeded');
                    node.log('assigned hub=' + result.assignedHub);
                    node.log('deviceId=' + result.deviceId);
                    node.iothub = result.assignedHub;
                    node.deviceid = result.deviceId;
                    initiateClient(node, options, deviceProtocol);
                }
            });
        };
    };

    // Initiate an IoT device node in node-red
    function initiateClient(node, options, deviceProtocol){
        // Set the client connection string and options
        var connectionString = 'HostName=' + node.iothub + ';DeviceId=' + node.deviceid +
            ((node.authenticationmethod == 'sas') ? (';SharedAccessKey=' + node.saskey) : ';x509=true');
        if (node.isDownstream) {
            connectionString = connectionString + ';GatewayHostName=' + node.gatewayhostname;
            options.ca = node.x509edgecertificate;
        }
        // Define the client
        var client = Client.fromConnectionString(connectionString, deviceProtocol);
        client.setOptions(options);
        client.on('error', function (err) {
            node.log('Device Client error:' + err);
        });
        client.open(function(err) {
            if (err) {
                node.error(node.deviceid + ' -> Device client open error:' + err);
            } else {
                node.log(node.deviceid + ' -> Device client connected.');
                setStatus(node, statusEnum.connected);

                // Get the device twin 
                client.getTwin(function(err, twin) {
                    if (err) {
                        node.error(node.deviceid + ' -> Could not get the device twin: ' + err);
                    } else {
                        node.log(node.deviceid + ' -> Device twin created.');
                        node.log(node.deviceid + ' -> Twin contents:' + JSON.stringify(twin.properties));
                        twin.on('properties.desired', function(val) {
                            node.log(node.deviceid + ' -> desired properties received: ' + JSON.stringify(val));
                            var msg = {};
                            msg.topic = 'properties';
                            msg.payload = val;
                            // Report back received desired properties ** Only for IoT Central Devices **
                            if (node.isIotcentral) {
                                for (let setting in val){
                                    if (setting.indexOf('$') === -1) {
                                        var patch = {
                                            [setting]: {
                                                value: val[setting],
                                                status: 'completed',
                                                desiredVersion: val.$version,
                                                message: 'Node-Red Azure IoT Device'
                                            }
                                        }
                                        sendDeviceProperties(node, twin, patch);
                                    }
                                }
                            }
                            node.send(msg);
                        });
                    }
                });

                node.on('close', function() {
                    node.log(node.deviceid + ' -> Azure IoT Device Client closed.');
                    twin.removeAllListeners();
                    client.removeAllListeners();
                    client.close();
                });

                // Listen to node input to send telemetry or reported properties
                node.on('input', function (msg) {
                    if (typeof (msg.payload) === "string") {
                        //Converting string to JSON Object
                        msg.payload = JSON.parse(msg.payload);
                    }
                    if (msg.topic === 'telemetry') {
                        sendDeviceTelemetry(node, client, msg.payload);
                    } else if (msg.topic === 'properties') {
                        sendDeviceProperties(node, twin, msg.payload);
                    }
                });

                // Listen to commands for defined direct methods
                for (let method in node.methods) {
                    node.log(node.deviceid + ' -> adding direct method: ' + node.methods[method].name);
                    var mthd = node.methods[method].name;
                    // Define the method on the client
                    client.onDeviceMethod(mthd, function(request, response) {
                        node.log(node.deviceid + ' -> Direct method call received: ' + request.methodName);
                        node.log(node.deviceid + ' -> Method payload:' + JSON.stringify(request.payload));
                        node.send({payload: request, topic: "method"});

                        // complete the response
                        response.send(200, request.methodName + ' was called on ' + node.deviceid + ' with payload: '
                                + (typeof(request.payload) === 'string' ? request.payload : JSON.stringify(request.payload)), function(err) {
                            if(!!err) {
                                node.error(node.deviceid + ' -> An error ocurred when sending a method response: ' +
                                    err.toString());
                            } else {
                                node.log(node.deviceid + ' -> Response to method ' + request.methodName +
                                    ' sent successfully.' );
                            }
                        });
                    }); 
                };

                // Start listening to C2D messages
                node.log(node.deviceid + ' -> listening to C2D messages');
                // Define the message listener
                client.on('message', function (msg) {
                    node.log(node.deviceid + ' -> C2D message received, data: ' + msg.data);
                    node.send({payload: msg, topic: "message"});
                    client.complete(msg, function (err) {
                    if (err) {
                        node.error(node.deviceid + ' -> C2D Message complete error: ' + err);
                    } else {
                        node.log(node.deviceid + ' -> C2D Message completed.');
                    }
                    });
                });
            }
        });
    };

    // Send messages to IoT platform (Transparant Edge, IoT Hub, IoT Central)
    function sendDeviceTelemetry(node, client, message) {
        if (validateMessage(message)){
            if (message.timestamp && isNaN(Date.parse(message.timestamp))) {
                node.error(node.deviceid + ' -> Invalid format: if present, timestamp must be in ISO format (e.g., YYYY-MM-DDTHH:mm:ss.sssZ)');
            } else {
                // Create message and set encoding and type
                var msg = new Message(JSON.stringify(message));
                msg.contentEncoding = 'utf-8';
                msg.contentType = 'application/json';
                client.sendEvent(msg, function(err,res) {
                    if(err) {
                        node.error(node.deviceid + ' -> An error ocurred when sending telemetry: ' + err);
                    } else {
                        node.log(node.deviceid + ' -> sent telemetry: ' + JSON.stringify(message));
                    }
                });
                
            }            
        } else {
            node.error(node.deviceid + ' -> Invalid message format.');
        }
    };

    // Send device reported properties.
    function sendDeviceProperties(node, twin, properties) {
        twin.properties.reported.update(properties, function (err) {
            if (err) {
                node.error(node.deviceid + ' -> sent device properties failed: ' + err);
            } else {
                node.log(node.deviceid + ' -> sent device properties: ' + JSON.stringify(properties)); 
            }
        });
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

    // Registration of the client into Node-RED
    RED.nodes.registerType("iotedgegateway", IoTEdgeGateway, {
        defaults: {
            gatewayhostname: {value: ""},
            x509edgecertificate: {value: ""}
        }
    });

    // Registration of the node into Node-RED
    RED.nodes.registerType("azureiotdevice", AzureIoTDevice, {
        defaults: {
            deviceid: {value: ""},
            connectiontype: {value: ""},
            authenticationmethod: {value: ""},
            enrollmenttype: {value: ""},
            iothub: {value: ""},
            isIotcentral: {value: false},
            scopeid: {value: ""},
            saskey: {value: ""},
            x509certificate: {value: ""},
            protocol: {value: ""},
            methods: {value: []},
            isDownstream: {value: false}
        }
    });
}
