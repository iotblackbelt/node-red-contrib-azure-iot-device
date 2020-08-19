# Azure IoT Device Node-RED node
The Azure IoT Device Node-RED node is a node that can be used to connect Node-RED to the Azure IoT platform. It can connect to Azure IoT Hub, Azure IoT Central, and use Azure IoT Edge as a transparant gateway. The node has been created to support the different attestation methodes (SAS, X.509) as well as use Azure Device Provisioning service. The node has been developed using the [Azure IoT Node.js SDK](https://github.com/Azure/azure-iot-sdk-node/).
The Azure IoT Device Node-RED node can be used to test your device setup using Node-RED. 

> DISCLAIMER: The Azure IoT Device Node-RED node is developed as is. Please be aware that use of this code and the node is at your own risk.

## Deploy the node to your Node-RED
The node can be manually deployed using the 'npm install &lt;folder&gt;' command. How to get started with Node-RED can be found here: https://nodered.org/docs/getting-started/.

Steps to install this node:

1. [Install Node-RED](https://nodered.org/docs/getting-started/local) on your machine or on an [Azure virtual machine](https://nodered.org/docs/getting-started/azure)
2. Clone this repository to a local directory on your machine runing Node-RED: <code>git clone https://github.com/iotblackbelt/node-red-contrib-azure-iot-device.git</code>
3. In your Node-RED user directory, typically ~/.node-red, run:

    <code>npm install &lt;location of node module&gt;</code><br/>
    For example, on Mac OS or Linux, if the node is located at ~/my-nodes/node-red-contrib-azure-iot-device you would do the following:

    <code>cd ~/.node-red<br/>
    npm install ~/my-nodes/node-red-contrib-azure-iot-device</code>

    On Windows you would do:

    <code>cd C:\Users\<user>\.node_red<br/>
    npm install &lt;Windows Directory&gt;\node-red-contrib-azure-iot-device</code>

This creates a symbolic link to your node module project directory in ~/.node-red/node_modules so that Node-RED will discover the node when it starts. Any changes to the node’s file can be picked up by simply restarting Node-RED. On Windows, use npm 5.x or greater.<br/>

>Note : npm will automatically add an entry for your module in the package.json file located in your user directory. If you don't want it to do this, use the --no-save option to the npm install command.

## Good to know
The Azure IoT Device Node-RED node can be setup as an Azure IoT Device using multiple attestation methods and provisioning. In this README I will not explain the details of the provisioning and attestation methods, but will explain what you need to use as node settings to enable them.<br/>

>For more information on provsionig read:
>* Manual provisioning with [Azure IoT Hub](https://docs.microsoft.com/en-us/azure/iot-hub/)
>    * Using the Azure Portal, Azure CLI, Visual Studio Code, Powershell or the Azure IoT Services SDK.
>* Automated provisioning using [Azure IoT Device Provisioning Services](https://docs.microsoft.com/en-us/azure/iot-dps/)

The Azure IoT Device Node-RED node can either use a symmetric key or a X.509 certificate as the attestation mechanism. More information on using symmetric key or X.509 certificates can be found in the Azure IoT Hub and Device Provisioning Services documentation online.

## Create and setup an Azure IoT Device Node-RED node
Once you installed Node-RED and the Azure IoT Device Node-RED node, run Node-RED and browse to the Node-RED website on your machine &lt;node-red-machine&gt;:1880.
In the nodes section on the left-hand side, scroll down to the bottom where you will find the Azure IoT Device node: 
<div><img alt="Azure IoT Device node" style="align:left;float:none" src="images/node.png"/></div>

### Steps to setup the node
Like any other Node-RED node you can create an instance of this node by dragging it onto a flow. Once you've dragged it into the flow you have to setup the node as a specific Azure IoT device. In this section I will explain the different setting-tabs and how you can use them to define the behavior of the Azure IoT device.

#### Device Identity
You need to use the Device Identity tab to define the device and the way it connects to Azure IoT. Depending on the choices you make in the drop-down boxes you will see addtional fields and options.
<div><img alt="Device identity tab" style="align:left;float:none" src="images/device-identity-tab-00.png"/></div>

##### Fields and options
The following table contains explanation of the fields and options on the Device Indentity tab:
| Field | Description | Required |
| --- | --- | --- |
| :--- | :--- | ---: |
| Device ID | This field wil contain the device Id of the Azure IoT device as it is/will be on IoT Hub or IoT Central | Yes |



## Future plans for development
It is my intention to add the following features to the Azure IoT Device Node-RED node:
* [Azure IoT Plug and Play](https://docs.microsoft.com/en-us/azure/iot-pnp/overview-iot-plug-and-play) support.