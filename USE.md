# Use the Azure IoT Device Node
In this document we describe how to use the Azure IoT Device node for D2C and C2D communication.

## Supported interactions
The Azure Device node can be used for:
- sending telemetry
- receiving and responding to commands
- receiving desired properties
- updating reported properties
- receiving C2D messages

Each interaction will be described in detail in the next sections. The node has a single input and a single output. The node determines the actions to take, based on the topic of Node-RED message.

## Output topics
The following output topics are supported:
- 'provisioning' - the outcome of the provisioning process
- 'property' - desired properties received
- 'command' - a received direct method
- 'message' - a received C2D message

### Output provisioning message
When the node is deployed using Device Provisioning a node message in the following format will be received on the output, when the provisioning is successful:

```
{
    'topic':'provisioning',
    'deviceId':'<device_id>',
    'payload': {
        'registrationId':'<device_id>',
        'createdDateTimeUtc':'UTC_timestamp>',
        'assignedHub':'<iot_hub_name>.azure-devices.net',
        'deviceId':'<device_id>',
        'status':'<provisioning_status>',
        'substatus':'<provisioning_substatus>',
        'lastUpdatedDateTimeUtc':'<UTC_tinestamp>',
        'etag':'<etag>',
        'payload': { <custom_provisioning_payload> } /* optional */
    }
}
```

You can use this provisioning message to do additional processing on the device side. If you use [custom allocation policies](https://docs.microsoft.com/en-us/azure/iot-dps/how-to-use-custom-allocation-policies) you can return a [payload to the device](https://docs.microsoft.com/en-us/azure/iot-dps/how-to-send-additional-data) that can be used for processing.

### Output property message
When you update the desired properties on a device twin in Azure, the node will send a node message to the output containing the updated desired properties:

```
{
    'topic':'property',
    'deviceId':'device_id',
    'payload': {
        '<property>': <value>,
        ...
        '$version': <version_number>
    }
}
```

You can use this message to do additional processing on the device.

> Azure IoT Central and PnP expect a response on a desired property change. See [Input reported properties](./USE.md#input-reported-properties) for the message structure.

### Output command message
When you send a direct method to the device from Azure, the node will send a node message to the output containing the command and its parameters:

```
{
    'topic':'command',
    'deviceId':'device_id',
    'requestId': '<request_id>',
    'methodName': '<method_name>',
    'payload': {
        '<paramter>': <value>,
        ...
    }
}
```

You can use this message to do additional processing on the device.
> The Azure IoT Platform requires a response on a direct method. To send this response you can use the [Input a command response](./USE.md#input-a-command-response). Make sure you use the same request_id, to ensure command and response correlation.

### Output C2D message
When you send a C2D message to the device from Azure, the node will send a node message to the output containing the message and its parameters:

```
{
    "topic":"message",
    "deviceId":"node-red-21",
    "messageId":"",
    "data":"<message_data>",
    "properties": {
        "propertyList":
            [<property_array>]
    }
}
```

You can use this message to do additional processing on the device. A message doesn't require a response to be send back.

## Input topics
The following input topics are supported:
- 'telemetry' - telemetry to be send
- 'property' - properties to report
- 'response' - a response to a received direct method


### Input telemetry
Sending telemetry, including (optional) properties, requires you to create a connection to the node input and send a node message in the following format:

```
{
    'topic': 'telemetry',
    'payload': { 
        '<name>': <value>,
        ...
    },
    'properties': [                                           
       {'key':'<key>','value':<value>},
       ...
    ]
}
```

### Input reported properties
Sending reported properties requires you to create a connection to the node input and send a node message in the following format:

```
{
    'topic': 'property',
    'payload': { 
        '<name>': <value>,
        ...
    }
}
```

#### Azure IoT Central and PnP require a specific reported property format to be send.

The format for a root level desired property change reponse is:
```
{
    'topic': 'property',
    'payload': { 
        '<property_name>': {
            'value': <value>,
            'ac': <status_code>,
            'ad': '<message>',
            'av': <version>
        }
    }
}
```

The format for a component level desired property change reponse is:
```
{
    'topic': 'property',
    'payload': { 
        '<component_name>': {
            '<property_name>': <value>,
            '__t': 'c'
        }
    }
}
```

### Input a command response
Sending a command response requires you to create a connection to the node input and send a node message in the following format:

```
{
    'topic': 'response',
    'payload': { 
        'requestId': '<request_id>',
        'methodName': '<method_name>',
        'status': <status_code>,
        'payload': <payload>
    }
}
```

The request_id is provided by the received direct method, and will need to be returned to the Azure IoT Device node to establish the connection between command and response.
The status property is the device-supplied status of method execution. The payload can be anything that is considered an expexted response for the actual direct method.

## Catch errors
All node errors are catchable. See [Handling errors](https://nodered.org/docs/user-guide/handling-errors#catchable-errors) to understand catchable errors and how to use them.

## Example flow
Here is an example flow that implements all input topics and an automated response to a direct method. You only have to [configure](./CONFIGURE.md) your node to represent a device. Once you've configured the node and deployed the flow, the telemetry will be send every 5 seconds and the reported properties can be send by clicking the **Trigger reported properties**.

![Azure IoT Device node example](images/example-flow.png)

Paste the following code into the "Import nodes" dialog.
```json
[{"id":"3f287933.370c26","type":"azureiotdevice","z":"8b925e1d.d4bae","deviceid":"","pnpModelid":"","connectiontype":"","authenticationmethod":"","iothub":"","isIotcentral":false,"scopeid":"","enrollmenttype":"","saskey":"","certname":"","keyname":"","protocol":"mqtt","methods":[{"name":"blink"}],"DPSpayload":"","gatewayHostname":"","caname":"","cert":"","key":"","ca":"","x":740,"y":180,"wires":[["3b324938.562456","91745865.1dcbf8"]]},{"id":"3b324938.562456","type":"debug","z":"8b925e1d.d4bae","name":"Debug output","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","x":980,"y":140,"wires":[]},{"id":"d25d0bac.bc1648","type":"inject","z":"8b925e1d.d4bae","name":"Trigger telemetry","topic":"","payload":"","payloadType":"date","repeat":"5","crontab":"","once":true,"onceDelay":0.1,"x":240,"y":100,"wires":[["222c0397.643f0c"]]},{"id":"222c0397.643f0c","type":"function","z":"8b925e1d.d4bae","name":"telemetry","func":"msg = {\n    'topic': 'telemetry',\n    'payload': {'humidity': Math.round(10000*Math.random())/100,\n        'temperature': 20 + (Math.round(2500*Math.random())/100),\n        'pressure': 850 + (Math.round(35000*Math.random())/100)\n    }\n}\nreturn msg;","outputs":1,"noerr":0,"x":470,"y":100,"wires":[["3f287933.370c26"]]},{"id":"9973fed2.6ba9b","type":"inject","z":"8b925e1d.d4bae","name":"Trigger reported properties","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":220,"y":180,"wires":[["3a505702.e59f38"]]},{"id":"3a505702.e59f38","type":"function","z":"8b925e1d.d4bae","name":"properties","func":"msg = {\n    'topic': 'property',\n    'payload': { 'fanSpeed': {'value':120},\n        'voltage': {'value':5},\n        'current': {'value':55},\n        'irSwitch': {'value':true}\n    }\n}\nreturn msg;","outputs":1,"noerr":0,"x":470,"y":180,"wires":[["3f287933.370c26"]]},{"id":"91745865.1dcbf8","type":"function","z":"8b925e1d.d4bae","name":"command response","func":"if (msg.topic == \"command\") {\n   var responseMsg = {\n       \"topic\": \"response\",\n       \"payload\": {\n            \"requestId\": msg.payload.requestId,\n            \"methodName\": msg.payload.methodName,\n            \"status\": 200,\n            \"payload\": msg.payload.payload\n       }\n   };\n   return responseMsg;\n}\n","outputs":1,"noerr":0,"x":710,"y":300,"wires":[["3f287933.370c26"]]}]
```