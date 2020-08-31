# Deploy the Azure IoT Device node
In the document we describe how to deploy the Node-RED Azure IoT Device node.

## Prerequisites
- Node-RED needs to be installed on your machine to use this node 
- Git needs to be installed for the manual setup approach.
- NPM needs to be installed

## Manually deploy the node to your Node-RED instance
The node can be manually deployed using the Github repository code and 'npm install &lt;folder&gt;' command. How to get started with Node-RED can be found here: https://nodered.org/docs/getting-started/.

Steps to install this node:

1. Clone this repository to a local directory on your machine running Node-RED:

    ```
    git clone https://github.com/iotblackbelt/node-red-contrib-azure-iot-device.git
    ```
    
1. In your Node-RED user directory, typically ~/.node-red, run:

    ```
    npm install <location of node module>
    ```

    For example, on Mac OS or Linux, if the node is located at ~/my-nodes/node-red-contrib-azure-iot-device you would do the following:

    ```
    cd ~/.node-red
    npm install ~/my-nodes/node-red-contrib-azure-iot-device
    ```

    On Windows you would do:

    ```
    cd C:\Users\<user>\.node_red
    npm install <Windows Directory>\node-red-contrib-azure-iot-device
    ```

    This creates a symbolic link to your node module project directory in ~/.node-red/node_modules so that Node-RED will discover the node when it starts. Any changes to the node’s file can be picked up by simply restarting Node-RED. On Windows, use npm 5.x or greater.

1. Restart Node-RED. The Azure IoT Device node will be available in the Azure IoT nodes section.

>Note : npm will automatically add an entry for your module in the package.json file located in your user directory. If you don't want it to do this, use the --no-save option to the npm install command.

## Deploy the node using npm
Run command in Node-RED installation directory.

```
npm install node-red-contrib-azure-iot-device
```

or run command for global installation.

```
npm install -g node-red-contrib-azure-iot-device
```

## Install in Node-Red by managing the palette

Node-RED lets users manage their pallete by installing, removing, disabling or upgrading modules.

In Node-RED, open the menu and select 'Manage Pallete'. In the new window, select the 'Install' tab. Search for the module by typing in 'azure-iot-edge' in 'search modules'. The 'node-red-contrib-azure-iot-device' module will appear in the list. Select 'Install'. Confirm the installation.

Once installed, the 'Device' node can be found in the section named 'Azure IoT'.

## Next step
The next step is to [configure](./CONFIGURE.md) the node to represent a specific Azure IoT device.
