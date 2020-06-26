# Azure IoT Device Node-Red node
<p>The Azure IoT Device Node-Red node is a node that can be used to connect Node Red to the Azure IoT platform. It can connect to Azure IoT Hub, Azure IoT Central, and use Azure IoT Edge as a transparant gateway. The node has been created to support the different attestation methodes (SAS, X.509) as well as use Azure Device Provisioing service. The node has been developed using the [Azure IoT Node.js SDK](https://github.com/Azure/azure-iot-sdk-node).</p>

## Deploy the node to your Node-Red
<p>The node can be manually deployed using the 'npm install &lt;folder&gt;' command. 

Steps to install this node:
<ol>
<li>Clone this repository to a local directory on your machine runing Node-Red: <code>git clone https://github.com/iotblackbelt/node-red-contrib-azure-iot-device.git</code></li>
<li>
In your node-red user directory, typically ~/.node-red, run:

<code>npm install &lt;location of node module&gt;</code><br/>
For example, on Mac OS or Linux, if the node is located at ~/my-nodes/node-red-contrib-azure-iot-device you would do the following:

<code>cd ~/.node-red<br/>
npm install ~/my-nodes/node-red-contrib-azure-iot-device</code>

On Windows you would do:

<code>cd C:\Users\<user>\.node_red<br/>
npm install C:\Users\my_name\Documents\GitHub\node-red-contrib-azure-iot-device</code><br/></li>
</ol><br/>
This creates a symbolic link to your node module project directory in ~/.node-red/node_modules so that Node-RED will discover the node when it starts. Any changes to the node’s file can be picked up by simply restarting Node-RED. On Windows, use npm 5.x or greater.<br/>

>Note : npm will automatically add an entry for your module in the package.json file located in your user directory. If you don't want it to do this, use the --no-save option to the npm install command.</p>

## Using the node
