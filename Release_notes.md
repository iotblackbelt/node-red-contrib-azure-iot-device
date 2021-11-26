# Release notes

## Release 0.2.4:
- Bug fixes:
    - [#26](https://github.com/iotblackbelt/node-red-contrib-azure-iot-device/issues/26): Why is SAS key visible in logging bug?
        - Connection string logging removed.
    - [#25](https://github.com/iotblackbelt/node-red-contrib-azure-iot-device/issues/25): New device on another flow: message "leakage" between devices?
        - Bug in node code, has been fixed
    - [#24](https://github.com/iotblackbelt/node-red-contrib-azure-iot-device/issues/24): TypeError exception with desired properties message
        -  Bug in node code, has been fixed
    - [#21](https://github.com/iotblackbelt/node-red-contrib-azure-iot-device/issues/21): Node-Red device fails provisioning using CA certificates
        -  Bug in node code, has been fixed. Be aware only CA based X.509 certificates (self-signed or from a certificate authority) are supported.

- Updates:
    - Automatic response on desired property changes for IoT Central and PnP devices has been removed. It is up to the flow-logic in Node-Red to confirm receipt. The change has been made because the logic in Node-Red should determine whether action is taken based on desired property updates. Similar to the command (direct method) approach. Examples of root and component the confirmation messages are added to the [use](https://github.com/iotblackbelt/node-red-contrib-azure-iot-device/blob/master/USE.md) document.
    - Documentation: 
        - CONFIGURE.md added: "Currently only CA based X.509 (group) certificates are supported. Individual device certificates are not. Both individual and group SAS Keys are supported."
        - USE.md added: description of "Azure IoT Central and PnP require a specific reported property"

## Release 0.2.5:
- Bug fixes:
    - [#27](https://github.com/iotblackbelt/node-red-contrib-azure-iot-device/issues/27): Incorrect azure-iot-device-amqp version in 0.2.4?
        - Wrong version in package.json, has been fixed