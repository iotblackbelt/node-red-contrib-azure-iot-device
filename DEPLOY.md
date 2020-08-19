# Deploy the Azure IoT Device node
In the document we describe how to deploy the Node-RED Azure IoT Device node.

## Prerequisites
Node-RED and Git need to be installed on your machine to run this node and use the manual setup approach.

## Manually deploy the node to your Node-RED
The node can be manually deployed using the Github repository code and 'npm install &lt;folder&gt;' command. How to get started with Node-RED can be found here: https://nodered.org/docs/getting-started/.

Steps to install this node:

1. Clone this repository to a local directory on your machine runing Node-RED: <code>git clone https://github.com/iotblackbelt/node-red-contrib-azure-iot-device.git</code>
1. In your Node-RED user directory, typically ~/.node-red, run:

    <code>npm install &lt;location of node module&gt;</code><br/>
    For example, on Mac OS or Linux, if the node is located at ~/my-nodes/node-red-contrib-azure-iot-device you would do the following:

    <code>cd ~/.node-red<br/>
    npm install ~/my-nodes/node-red-contrib-azure-iot-device</code>

    On Windows you would do:

    <code>cd C:\Users\<user>\.node_red<br/>
    npm install &lt;Windows Directory&gt;\node-red-contrib-azure-iot-device</code>

This creates a symbolic link to your node module project directory in ~/.node-red/node_modules so that Node-RED will discover the node when it starts. Any changes to the node’s file can be picked up by simply restarting Node-RED. On Windows, use npm 5.x or greater.<br/>

>Note : npm will automatically add an entry for your module in the package.json file located in your user directory. If you don't want it to do this, use the --no-save option to the npm install command.

## Deploy the node using 'Manage palette'
**TBD**: get node available in the the Node-RED repository.

## Next step
The next step is to [configure](./CONFIGURE.md) the node to represent a specific Azure IoT device.