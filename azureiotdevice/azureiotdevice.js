module.exports = function (RED) {
    'use strict'

    var Client = require('azure-iot-device').Client;

    var Protocols = {
        amqp: require('azure-iot-device-amqp').Amqp,
        amqpWs: require('azure-iot-device-amqp').AmqpWs,
        mqtt: require('azure-iot-device-mqtt').Mqtt,
        mqttWs: require('azure-iot-device-mqtt').MqttWs,
        http: require('azure-iot-device-http').Http
    };

    var Message = require('azure-iot-device').Message;

    var statusEnum = {
        connected: { color: "green", text: "Connected" },
        disconnected: { color: "red", text: "Disconnected" },
        send: { color: "blue", text: "Sending message" },
        error: { color: "grey", text: "Error" }
    };

    // Setup node-red node to represent Azure IoT Device
    function AzureIoTDevice(config) {
        // Store node for further use
        var node = this;
        node.deviceid = config.deviceid;
        node.scopeid = config.scopeid;
        node.key = config.key;
        node.protocol = config.protocol;

        // Create the Node-RED node
        RED.nodes.createNode(this, config);
        setStatus(node, statusEnum.disconnected);

        var client;

        // Use cached device connectionstring if possible avoiding DPS calls
        if (deviceCache[node.deviceid] && deviceCache[node.deviceid].connectionString) {
           client = new IoTClient(node.deviceid, node.scopeid, 'conn_string', deviceCache[node.deviceid].connectionString); 
        }
        else {
            client = new IoTClient(node.deviceid, node.scopeid, 'symm_key', node.key);
        }


        node.log('Connect IoT Device: ' + node.deviceid);
        client.connect()
        .then(() => {
            if (node.protocol) {
                client.setProtocol(node.protocol);
            }
            initiateDevice(node,client);
        })
        .catch((err) => {
            // Retry with sym_key if first connection doesn't work
            client = new IoTCClient(node.deviceid, node.scopeid, 'symm_key', node.key);
            if (node.protocol) {
                client.setProtocol(node.protocol);
            }
            client.connect()
            .then(() => {
                initiateDevice(node,client);
            })
            .catch((err) => {
                node.log(err);
                setStatus(node, statusEnum.error);
            });
        });
    }

    // Set status of node on node-red
    var setStatus = function (node, status) {
        node.status({ fill: status.color, shape: "dot", text: status.text });
    }

    // Send messages to IoT platform (Transparant Edge, IoT Hub, IoT Central)
    function sentMessage(node, client, message) {
        setStatus(node, statusEnum.send);
   
        if (message.timestamp && isNaN(Date.parse(message.timestamp))) {
            throw new Error('Invalid format: if present, timestamp must be in ISO format (e.g., YYYY-MM-DDTHH:mm:ss.sssZ)');
        }

        // Check if measurements
        if (message.measurements){
           if (!validateMeasurements(message.measurements)) {
                throw new Error('Invalid format: invalid measurement list.');
            }
            client.sendTelemetry(message.measurements);
            node.log('Sent telemetry for ' + node.deviceid + ": " +JSON.stringify(message.measurements));
        }

        // Check if properties
        if (message.properties){
            client.sendProperty(message.properties);
            node.log('Sent reported properties for ' + node.deviceid + ": " +JSON.stringify(message.properties));
        }
    };

    // Initiate an IoT device node in node-red
    function initiateDevice(node, client){
        setStatus(node, statusEnum.connected);
        if (!deviceCache[node.deviceid].connectionString) {
            deviceCache[node.deviceid].connectionString = client.getConnectionString();
        }
        node.log('Device connected: ' + node.deviceid);

        client.on('SettingsUpdated', (val) => {
            node.log('Settings received for ' + node.deviceid + ": " + JSON.stringify(val));
            var msg = {};
            msg.payload = {};
            for (const setting in val){
                if (typeof val[setting] === 'object')
                {
                    val[setting].status = 'received',
                    val[setting].desiredVersion = val.$version,
                    val[setting].message = ''
                }
            }
            msg.payload.settings = val;
            node.send(msg);
        });

        client.on('Command', (cmd) => {
            node.log('Command received for ' + node.deviceid + ": " +JSON.stringify(cmd));
            var msg = {};
            msg.payload = {};
            msg.payload.command = {
                [cmd.commandName]: {
                    value: cmd.payload.value,
                    requestId: cmd.requestId
                }
            };
            node.send(msg);
        });

        // Receive node input
        node.on('input', function (msg) {
            if (msg.payload) {
                // Pass the node, client and msg.payload object parts
                try {
                    sentMessage(node, client, msg.payload);
                    setStatus(node, statusEnum.connected);
                } catch (e) {
                    node.log(e.message);
                    setStatus(node, statusEnum.error);
                }
            }
        });

        node.on('close', function(done) {
            setStatus(node, statusEnum.disconnected);
            done();
        });
    }

    /**
     * @returns true if measurements object is valid, i.e., a map of field names to numbers or strings.
     */
    function validateMeasurements(measurements) {
        if (!measurements || typeof measurements !== 'object') {
            return false;
        }

        for (const field in measurements) {
            if (typeof measurements[field] !== 'number' && typeof measurements[field] !== 'string') {
                if (typeof measurements[field] === 'object')
                {
                    validateMeasurements(measurements[field]);
                }
                else {
                    return false;
                }
            }
        }

        return true;
    }

    // Registration of the node into Node-RED
    RED.nodes.registerType("azureiotdevice", AzureIoTDevice, {
        defaults: {
            deviceid: {value: ""},
            connectiontype: {value: ""},
            authenticationmethod: {value: ""},
            enrollmenttype: {value: ""},
            iothub: {value: ""},
            scopeid: {value: ""},
            saskey: {value: ""},
            x509certificate: {value: ""},
            protocol: {value: ""},
            gatewayhostname: {value: ""},
            x509edgecertificate: {value: ""}
        }
    });
}
