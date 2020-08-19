# Deploy and setup the Azure IoT Device Node
In the document we describe how to install and setup the Node-RED Azure IoT Device node.

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
The following table contains explanation of the fields and options on the **Device Indentity** tab. Some fileds will only be visible depending on selection choices made in other fields.
| Field/option | Description | Depends on |
| --- | --- | --- |
| Device ID | This field wil contain the device Id of the Azure IoT device as it is/will be on IoT Hub or IoT Central. | - |
| Connection Type | This option indicates whether the device will use a preset connection string or use [Device Provisioning Service](https://docs.microsoft.com/en-us/azure/iot-dps/). Depending on the option you select different fields will be shown to fill. | - |
| Authentication Method | Azure IoT supports two authentication types, SAS token-based authentication and X.509 certificate authentication (individual and CA based). | - |
| IoT Hub Hostname | The [Azure IoT Hub](https://docs.microsoft.com/en-us/azure/iot-hub/) Hostname '%iothubname%.azure-device.net'. The name can be found in the Azure portal on the overview page of the IoT Hub. | Connection Type |
| IoT Central Device | Option to indicate whether the device is an [Azure IoT Central](https://docs.microsoft.com/en-us/azure/iot-central/) device.  | Connection Type |
| Scope ID | The device provisioning Scope ID. This ID identifies the specific Azure Device Provisioning service to use. Azure IoT Central devices can only be provisioned using Device Provisioning. | Connection Type |
| Enrollment type | Selection to indicate whether the device provisioning enrollment is an individual or a group enrollment. | Connection Type |
| Authentication Method | Selection to indecate whther the attestation method used is shared access key (SAS) or certificate (X.509). | - |
| SAS Key | The [symmetric key](https://docs.microsoft.com/en-us/azure/iot-dps/concepts-symmetric-key-attestation) to authenticate with the Device Provisioning Service (DPS) instance or Azure IOT Central. | Authentication Method |
| X.509 Certificate | The [X.509](https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-x509ca-overview) certifate, containing the full of the certificate tree for the IoT device. The certificate can be uploaded. | Authentication Method |
| X.509 Key | The Azure IoT device X.509 key. The key can be uploaded. | Authentication Method |
| Protocol | The Azure IoT platform supports three communication [protocols](https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-devguide-protocols): HTTPS, MQTT and AMQP. AMQP and MQTT can also be used over websockets. In this node you can only select the MQTT and AMQP, because these protocols support direct communicaton between device and cloud. If you need to use the 443 port outbound from the device, you can use the websockets options. | - |

#### Device Identity