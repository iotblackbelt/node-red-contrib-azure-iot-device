# Azure IoT Device Node-RED node
The Azure IoT Device Node-RED node is a node that can be used to connect Node-RED to the Azure IoT platform. It can connect to Azure IoT Hub, Azure IoT Central, and use Azure IoT Edge as a transparant gateway. The node has been created to support the different attestation methodes (SAS, X.509) as well as use Azure Device Provisioning Service. The node has been developed using the [Azure IoT Node.js SDK](https://github.com/Azure/azure-iot-sdk-node/).

> DISCLAIMER: The Azure IoT Device Node-RED node is developed as is. Please be aware that use of this code and the node is at your own risk.

## Deploy the Azure Device node on your Node-RED installation
In the [deploy](./DEPLOY.md) document we describe how to deploy the node to Node-RED.

## Configure an Azure IoT Device node
In the [configure](./CONFIGURE.md) document we describe how to setup an individual Azure IoT Device node.

## Use an Azure IoT Device node
In the [use](./USE.md) document we describe how to use the Azure IoT Device node to interact with the Azure IoT platform.
- sending telemetry
- receiving and responding to commands
- receiving desired properties
- updating reported properties
- receiving C2D messages

## Future plans for development
It is our intention to add the following features to the Azure IoT Device Node-RED node:
* Full [Azure IoT Plug and Play](https://docs.microsoft.com/en-us/azure/iot-pnp/overview-iot-plug-and-play) support.