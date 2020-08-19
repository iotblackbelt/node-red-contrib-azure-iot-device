# Use the Azure IoT Device Node
In this document we describe how to use the Azure IoT Device node for D2C and C2D communication.

## Supported interactions
The Azure Device node can be used for:
- sending telemetry
- receiving and responding to commands
- receiving desired properties
- updating reported properties
- receiving C2D messages

Each interaction will be descrbide in detail in the next sections. The node has a single input and a single output. The node determines the actions to take, based on the topic of Node-RED message.

### Input topics
The following input topics are supported:
- 'telemetry' - telemetry to be send
- 'property' - properties to report
- 'response' - a response to a received direct method

### Output topics
The following output topics are supported:
- 'provisioning' - the outcome of the provisioning process
- 'property' - desired properties received
- 'command' - a received direct method
- 'message' - a received C2D message

## Input telemetry
Sending telemetry requires you to create a connection to the node input and send a node message in the following format:

```json
{
    'topic': 'telemetry',
    'payload': { 
        '<name>': '<value>',
        ...
    }
}
```

## Input reported properties
Sending reported properties requires you to create a connection to the node input and send a node message in the following format:

```json
{
    'topic': 'property',
    'payload': { 
        '<name>': <value>,
        ...
    }
}
```

If your device is an IoT Central device you should use the following format:
```json
{
    'topic': 'telemetry',
    'payload': { 
        '<name>': {'value': <value>},
        ...
    }
}
```

## Input a command response
Sending a command response requires you to create a connection to the node input and send a node message in the following format:

```json
{
    'topic': 'response',
    'requestId': <request_id>,
    'status': <status_code>,
    'payload': { 
        '<name>': <value>,
        ...
    }
}
```

The request_id is provided by the received direct method, and will need to be returned to the Azure IoT platform to establish the connection between command and response.
The status property is the device-supplied status of method execution. 

## Output property message
When the node is deployed using Device Provisioning a node message in the following format will be received on the output, when the provisioning is successful:

```json
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

You can use this provisioning message to do some additional processing on the device side. If you use [custom allocation policies](https://docs.microsoft.com/en-us/azure/iot-dps/how-to-use-custom-allocation-policies) you can return a [payload to the device](https://docs.microsoft.com/en-us/azure/iot-dps/how-to-send-additional-data) that can be used for processing.

## Output provisioning message
When you update the desired properties on a device twin in Azure, the node will send a node message to the output containing the updated desired properties:

```json
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

## Output command message
When you send a direct method to the device from Azure, the node will send a node message to the output containing the command and its parameters:

```json
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

You can use this message to do additional processing on the device. The Azure IoT Platform expects a response on a direct method. To send this response 

