import { connect as tslConnect } from 'tls';
import { connect as netConnect } from 'net';
import { EventEmitter } from 'events';
import { ConnectOptions } from './lib/interfaces';

import getElkMessage from './lib/factory';
import {
  ElkMessage,
  ArmingStatusReport,
  OutputStatusReport,
  TextStringDescriptionReport,
  ZoneDefinitionReport,
  ZonePartitionReport,
  ZoneStatusReport,
  ZoneBypass,
  ZoneChangeUpdate,
  ZoneVoltageReport,
  KeypadAreasReport
} from './lib/messages';
import { ArmMode, TextDescriptionType, Words } from './lib/enums';
import { textDescriptionMaxRange } from './lib/types';
import { leftPad } from './lib/utils';


class Elk extends EventEmitter {

  private isAuthorized: boolean = false;
  private connection: any = null;

  constructor(
    public port: number = 2101,
    public host: string = '192.168.1.0',
    public options: ConnectOptions = {
      secure: false,
      rejectUnauthorized: false,
      secureProtocol: 'TLSv1_method'
    }
  ) {

    super();
  }

  connect() {
    if (this.options.secure) {
      this.connection = tslConnect(
        this.port,
        this.host,
        {
          rejectUnauthorized: this.options.rejectUnauthorized,
          secureProtocol: this.options.secureProtocol
        },
        () => this.onConnect());
    }
    else {
      this.connection = netConnect({
        host: this.host,
        port: this.port
      },
        () => this.onConnect());
    }

    this.connection.setEncoding('ascii');

    // Listen for incoming data 
    this.connection.on('data', (data) => this.onDataReceived(data));

    // error event handler
    this.connection.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        this.emit('error', 'Connection to M1XEP failed!');
      } else if (err.code === 'ECONNRESET') {
        this.emit('error', err.code);
        // connection was reset, attempt to reconnect
        if (this.connection) {
          this.connection.destroy();
        }
        this.connect();
      } else {
        this.emit('error', err.code);
      }
    });

    // close event handler
    this.connection.on('close', () => {
      this.emit('end', 'The connection to the Elk M1 has been lost');
    });
  }

  onConnect() {
    this.emit('connected');
  }

  onDataReceived(data) {
    // check for elk auth requests
    if (data == 'Username:') {
      return this.connection.write(this.options.userName + '\r\n');
    } else if (data.indexOf('Password:') != -1) {
      return this.connection.write(this.options.password + '\r\n');
    } else if (data.indexOf('Elk-M1XEP: Login successful.') !== -1) {
      this.isAuthorized = true;
      this.emit('connected');
      return;
    }

    // we are getting a weird message during auth process
    if (this.options.secure && (!this.isAuthorized || data.substring(0, 2) === '**')) {
      return;
    }

    try
    {
    // Split on newline in case multiple messages are received at one time.
    let messages: Array<string> = data.trim().split('\n');

    messages.forEach((message, index) => {
      // Remove carriage return
      message = message.replace('\r', '');

      // Parse message using Elk factory method
      let elkMessage = getElkMessage(message);

      // Emit message
      this.emit('*', elkMessage);
      this.emit(elkMessage.type, elkMessage);
    });
    } catch (e){
      this.emit('error', e);
    }
  }

  /**
   * Arm an Area by id.
   * 
   * @param {number} areaId
   * @param {ArmMode} armMode
   * @param {string} keypadCode
   */
  arm(areaId: number, armMode: ArmMode, keypadCode: string) {
    let elk = new ElkMessage(`a${armMode}${areaId}${leftPad(keypadCode, 6, '0')}`, null);
    this.connection.write(`${elk.message}\r\n`);
  }

  
  /**
   * Disarm an Area by id.
   * 
   * @param {number} areaId
   * @param {string} keypadCode
   */
  disarm(areaId: number, keypadCode: string) {
    let elk = new ElkMessage(`a0${areaId}${leftPad(keypadCode, 6, '0')}`, null);
    this.connection.write(`${elk.message}\r\n`);
  }

  
  /**
   * Activates a task. The task is deactivated when it completes.
   * 
   * @param {number} taskId
   */
  activateTask(taskId: number) {
    let elk = new ElkMessage(`tn${leftPad(taskId.toString(), 3, '0')}`, null);
    this.connection.write(`${elk.message}\r\n`);
  }

  /**
   * Turn output on.
   * 
   * @param {number} outputId
   * @param {number} seconds - Number of seconds output will be active
   */
  setOutputOn(outputId: number, seconds: number) {
    let elk = new ElkMessage(`cn${leftPad(outputId.toString(), 3, '0')}${leftPad(seconds.toString(), 5, '0')}`, null);
    this.connection.write(`${elk.message}\r\n`);
  }

  /**
   * Turn output off.
   * 
   * @param {number} outputId
   */
  setOutputOff(outputId: number) {
    let elk = new ElkMessage(`cf${leftPad(outputId.toString(), 3, '0')}`, null);
    this.connection.write(`${elk.message}\r\n`);
  }
  
  
  /**
   * Command Elk panel to speak a message over it's speaker.
   * 
   * @param {string} message
   */
  speak(message: string) {
    let words = message.split(' ');

    words.forEach(word => {
      let index = Words[word.toLowerCase()];
      let elk = new ElkMessage(`sw${leftPad(index, 3, '0')}`, null);
      this.connection.write(`${elk.message}\r\n`);      
    });
  }
  
  /**
   * Toggles a control Output On/Off.
   * 
   * @param {number} outputId
   */
  toggleOutput(outputId: number) {
    let elk = new ElkMessage(`ct${leftPad(outputId.toString(), 3, '0')}`, null);
    this.connection.write(`${elk.message}\r\n`);
  }
  
  /**
   * Bypass a Zone.
   * 
   * @param {number} zoneId
   * @param {number} areaId
   * @param {string} keypadCode
   */
  bypassZone(zoneId: number, areaId: number, keypadCode: string) {
    if (zoneId === null) {
      throw new TypeError('Zone id is a required option');
    }
    let elk = new ElkMessage(`zb${leftPad(zoneId.toString(), 3, '0')}${areaId}${leftPad(keypadCode, 6, '0')}`, null);
    this.connection.write(`${elk.message}\r\n`);
  }

  /**
   * Requests an Arming Status Report from the Elk panel.
   * 
   * @param {number} [timeout=5000]
   * @returns {ArmingStatusReport}
   */
  requestArmingStatus(timeout = 5000): Promise<ArmingStatusReport> {
    return new Promise((resolve, reject) => {
      //Listen for response
      this.once('AS', (response) => {
        resolve(response);
      });

      //Send the command
      let elk = new ElkMessage('as', null);
      this.connection.write(`${elk.message}\r\n`);

      //Setup timeout
      setTimeout(function () {
        reject('Timout occured before Arming Status (as) was received.');
      }, timeout);
    });
  }

  /**
   * Request Keypad Area assignments.
   * 
   * @param {number} [timeout=5000]
   * @returns {Promise<KeypadAreasReport>}
   * 
   * @memberOf Elk
   */
  requestAreas(timeout = 5000): Promise<KeypadAreasReport> {
    return new Promise((resolve, reject) => {
      //Listen for response
      this.once('KA', (response) => {
        resolve(response);
      });

      //Send the command
      let elk = new ElkMessage('ka', null);
      this.connection.write(`${elk.message}\r\n`);

      //Setup timeout
      setTimeout(function () {
        reject('Timout occured before Area request (ka) was received.');
      }, timeout);
    });
  }
    
  /**
   * Request the Control Output Status report from Elk panel.
   * 
   * @param {number} [timeout=5000]
   * @returns
   */
  requestOutputStatusReport(timeout = 5000): Promise<OutputStatusReport> {
    return new Promise((resolve, reject) => {
      //Listen for response
      this.once('CS', (response) => {
        resolve(response);
      });

      //Send the command
      let elk = new ElkMessage('cs', null);
      this.connection.write(`${elk.message}\r\n`);

      //Setup timeout
      setTimeout(function () {
        reject('Timout occured before Control Output Status (cs) was received.');
      }, timeout);
    });
  }

  /**
   * Request system trouble status (SS).
   * 
   * @param {number} [timeout=5000]
   * @returns {Promise<ElkMessage>}
   * 
   * @memberOf Elk
   */
  requestSystemStatus(timeout = 5000): Promise<ElkMessage> {
    return new Promise((resolve, reject) => {
      //Listen for response
      this.once('SS', (response) => {
        resolve(response);
      });

      //Send the command
      let elk = new ElkMessage('ss', null);
      this.connection.write(`${elk.message}\r\n`);

      //Setup timeout
      setTimeout(function () {
        reject('Timout occured before system status request (ss) was received.');
      }, timeout);
    });
  }

  /**
   * Request text description
   * 
   * @param {number} id
   * @param {TextDescriptionType} type
   * @param {number} [timeout=5000]
   * @returns {Promise<TextStringDescriptionReport>}
   * 
   * @memberOf Elk
   */
  requestTextDescription(id: number, type: TextDescriptionType, timeout = 5000): Promise<TextStringDescriptionReport> {
    return new Promise((resolve, reject) => {
      //Listen for response
      this.once('SD', (response) => {
        resolve(response);
      });

      //Send the command
      let elk = new ElkMessage(`sd${leftPad(type.toString(), 2, 0)}${leftPad(id.toString(), 3, 0)}`, null);
      this.connection.write(`${elk.message}\r\n`);

      //Setup timeout
      setTimeout(function () {
        reject('Timout occured before Text Description (sd) was received.');
      }, timeout);
    });
  }

  
  /**
   * For internal use by requestTextDescriptionAll. Asynchronous call to retreived
   * a Text Description.
   * @param {number} id
   * @param {TextDescriptionType} type
   * @param {any} cb
   * @param {number} [timeout=15000]
   */
  getDescription(id: number, type: TextDescriptionType, cb, timeout = 15000) {
    //Listen for response
    this.once('SD', (response) => {
      cb(response);
    });

    //Send the command
    let elk = new ElkMessage(`sd${leftPad(type.toString(), 2, 0)}${leftPad(id.toString(), 3, 0)}`, null);
    this.connection.write(`${elk.message}\r\n`);

    //Setup timeout
    setTimeout(function () {
      cb({ error: 'Timout occured before Text Description (sd) was received.'});
    }, timeout);
  }

  
  /**
   * Method returns the configured Text Descriptions, by type. We start at id=1.
   * If the requested id is not configured, Elk will return the next configured item (to speed up requests)
   * or 000 if no more valid names are found. Consult RS232 protocol guide for more info on SD messages.
   * So we'll recursively query the panel until we reach the max length, by type, or receive 000.
   * NOTE: This can be used to determine what has been configured on panel since a description is not returned
   * for unconfigured items. Useful for Tasks, Outputs, etc that don't have an Api call for retreving
   * configuration/definition.
   * @param {string} type
   * @param {number} [timeout=15000]
   * @returns {TextStringDescriptionReport}
   */
  requestTextDescriptionAll(type: TextDescriptionType, timeout = 15000): Promise<TextStringDescriptionReport[]> {
    // Text Description items received from panel
    const items = [];

    const recursiveCall = (id, resolve, reject) => {
      this.getDescription(id, type, (data) => {
        if(data.error) {
          reject(data.error);
        }

        // If the returned id == 0, then no more configured items.
        if(data.id > 0 && id < textDescriptionMaxRange[TextDescriptionType[type]]) {
          //panel returned a text description
          items.push(data);
          // Since panel returns the 'next' configured item, we need set the id to 
          // the last retreived one.
          id = data.id;
          id++; // Increment to next item
          recursiveCall(id, resolve, reject);
        } else {
          // Return items to caller
          resolve(items);
        }
      }, timeout);
    }

    // Promise is resolved when all items have been received.
    return new Promise((resolve, reject) => {
      recursiveCall(1, resolve, reject);
    });
  }
  
  /**
   * Requests a Zone Definition Report from the Elk panel.
   * 
   * @param {number} [timeout=5000]
   * @returns {ZoneDefinitionReport}
   */
  requestZoneDefinitionReport(timeout = 5000): Promise<ZoneDefinitionReport> {
    return new Promise((resolve, reject) => {
      //Listen for response
      this.once('ZD', (response) => {
        resolve(response);
      });

      //Send the command
      let elk = new ElkMessage('zd', null);
      this.connection.write(`${elk.message}\r\n`);

      //Setup timeout
      setTimeout(function () {
        reject('Timout occured before Zone Definition (zd) was received.');
      }, timeout);
    });
  }

  
  /**
   * Requests a Zone Partition Report from the Elk panel.
   * 
   * @param {number} [timeout=5000]
   * @returns {ZonePartitionReport}
   */
  requestZonePartitionReport(timeout = 5000): Promise<ZonePartitionReport> {
    return new Promise((resolve, reject) => {
      //Listen for response
      this.once('ZP', (response) => {
        resolve(response);
      });

      //Send the command
      let elk = new ElkMessage('zp', null);
      this.connection.write(`${elk.message}\r\n`);

      //Setup timeout
      setTimeout(function () {
        reject('Timout occured before Zone Partition (zp) was received.');
      }, timeout);
    });
  }

  
  /**
   * Requests a Zone Status Report from the Elk panel.
   * 
   * @param {number} [timeout=5000]
   * @returns {ZoneStatusReport}
   */
  requestZoneStatusReport(timeout = 5000): Promise<ZoneStatusReport> {
    return new Promise((resolve, reject) => {
      //Listen for response
      this.once('ZS', (response) => {
        resolve(response);
      });

      //Send the command
      let elk = new ElkMessage('zs', null);
      this.connection.write(`${elk.message}\r\n`);

      //Setup timeout
      setTimeout(function () {
        reject('Timout occured before Zone Status Report (zs) was received.');
      }, timeout);
    });
  }

  /**
   * Request zone voltage report
   * 
   * @param {number} id
   * @param {number} [timeout=5000]
   * @returns {Promise<TextStringDescriptionReport>}
   * 
   * @memberOf Elk
   */
  requestZoneVoltageReport(id: number, timeout = 5000): Promise<ZoneVoltageReport> {
    return new Promise((resolve, reject) => {
      //Listen for response
      this.once('ZV', (response) => {
        resolve(response);
      });

      //Send the command
      let elk = new ElkMessage(`zv${leftPad(id.toString(), 3, 0)}`, null);
      this.connection.write(`${elk.message}\r\n`);

      //Setup timeout
      setTimeout(function () {
        reject('Timout occured before Zone Voltage Report (zv) was received.');
      }, timeout);
    });
  }

  /**
   * Set thermostat data.
   * 
   * @param {number} thermostatId - The thermostat number to program (1-16).
   * @param {number} value - The value to set (00-99).
   * @param {number} element - The element to set.
   */
  setThermostat(thermostatId: number, value: number, element: number) {
    const message = 'The value parameter is outside accepted range.';
    // Do some validation
    if (element < 0 || element > 5)
      throw new Error(message.replace('value', 'element'));

    switch(element) {
      case 0:
        if (value < 0 || value > 4)
          throw new Error(message);
        break;
      case 1:
        if (value < 0 || value > 1)
          throw new Error(message);
        break;
      case 2:
        if (value < 0 || value > 1)
          throw new Error(message);
        break;
      case 4:
        if (value < 1 || value > 99)
          throw new Error(message);
        break;
      case 5:
        if (value < 1 || value > 99)
          throw new Error(message);
        break;
      default:
    }
  
    let elk = new ElkMessage(`ts${leftPad(thermostatId.toString(), 2, '0')}${leftPad(value.toString(), 2, '0')}${element.toString()}`, null);
    this.connection.write(`${elk.message}\r\n`);
  }

  /**
   * Disconnects from the Elk M1XEP.
   */
  disconnect() {
    if (this.connection) {
      this.connection.destroy();
    }
  }

}

export = Elk;
