import {
  LogicalState,
  PhysicalStatus,
  TextDescriptionType,
  WeekDay,
  Month,
  ThermostatMode,
  ChimeMode,
  TimerType,
  Key,
  IlluminationStatus
} from './enums';
import { armStatus, armUpState, alarmState, zoneDefinition, EventType } from './types';
import { AreaReport, ZoneDefinition } from './models';
import { responseTypes } from './types';


/**
 * Base type for all response/messages. Responsible for creating new Commands to send to Elk M1 OR
 * parsing/validating a response from Elk.
 * @export
 * @class ElkMessage
 */
export class ElkMessage {

  public message: string;
  protected body: string;
  private type: string;
  private hexLength: string;
  private checkSum: string;

  /**
   * Creates an instance of ElkMessage.
   * 
   * @param {string} command - Instantiate message from a new command, i.e. command = 'zs'.
   * @param {string} response - Instantiate message from an Elk response, i.e. response = '0AZC002200CE'.
   */
  constructor(command: string, response: string) {
    const futureUse = '00';

    if (command !== null && response !== null) {
      throw new TypeError('Provide only one argument: Either command or response');
    }

    if (command !== null) {
      this.body = command.substring(2, command.length) + futureUse;
      this.type = command.substring(0, 2);

      let length = (this.type + this.body).length + 2;
      let lengthStr = length.toString(16).toUpperCase();
      if (lengthStr.length === 1) {
        lengthStr = '0' + lengthStr;
      }
      this.hexLength = lengthStr;
      this.checkSum = this.calcChecksum();
      this.message = `${this.hexLength}${this.type}${this.body}${this.checkSum}`;
    } else {

      let length = response.length;

      this.message = response;
      this.body = response.substring(4, length - 2);
      this.type = response.substring(2, 4);
      this.hexLength = response.substring(0, 2);
      this.checkSum = response.substring(length - 2, length);

      // If it's a message I'm listening for, validate checksum
      if (responseTypes.get(this.type) === undefined) {
        if (!this.validChecksum()) {
          throw new TypeError(`The calculated checksum does not match the checksum on the received message: ${this.message}`);
        }
      }
    }
  }

  validChecksum() {
    return this.checkSum === this.calcChecksum()
  }

  calcChecksum() {
    const buf = new Buffer(`${this.hexLength}${this.type}${this.body}`);

    let sum = 0
    for (let i = 0; i < buf.length; i++) {
      sum = sum + buf[i];
    }

    let chars = (((sum & 0xff) ^ 0xff) + 1) & 0xff;

    return this.hex2(chars);
  }


  /**
   * Convert to 2 byte hex value.
   * 
   * @param {number} i
   * @returns
   */
  hex2(i: number) {
    let hex = i.toString(16).toUpperCase();
    if (hex.length === 1) {
      hex = `0${hex}`;
    }

    return hex;
  }
}

/**
 * Represents an Area Change Update message (AS)
 * 
 * @export
 * @class ArmingStatusReport
 * @extends {ElkMessage}
 */
export class ArmingStatusReport extends ElkMessage {
  areas: AreaReport[] = [];

  constructor(response: string) {
    super(null, response);

    const armStatuses = this.body.substring(0, 8).split('');
    const armUpStates = this.body.substring(8, 16).split('');
    const alarmStates = this.body.substring(16, 24).split('');

    for (let i = 0; i < 8; i++) {
      this.areas.push(new AreaReport(
        i + 1,
        armStatus.get(armStatuses[i]),
        armUpState.get(armUpStates[i]),
        alarmState.get(alarmStates[i])
      ));
    }
  }
}

/**
 * Represents Entry/Exit Time Data (EE)
 * 
 * @export
 * @class EntryExitTime
 * @extends {ElkMessage}
 */
export class EntryExitTime extends ElkMessage {
  areaId: number;
  timerType: TimerType;
  timer1: number;
  timer2: number;
  armedState: string;

  constructor(response: string) {
    super(null, response);

    this.areaId = +this.body.substring(0, 1);
    this.timerType = TimerType[this.body.substring(1, 2)];
    this.timer1 = +this.body.substring(2, 5);
    this.timer2 = +this.body.substring(5, 8);
    this.armedState = armStatus.get(this.body.substring(8, 9));
  }
}

/**
 * Keypad Areas Report (KA).
 * 
 * @export
 * @class KeypadAreasReport
 * @extends {ElkMessage}
 */
export class KeypadAreasReport extends ElkMessage {
  
  /** 
   * Distinct areas that are assigned to keypads.
   * 
   * @type {number[]}
   */
  areas: number[] = [];
  /** 
   * Keypad area assignments. Map<key=Keypad Id, value=Area Id>
   * 
   * @type {Map<number, number>}
   */
  keypadAreaAssignment: Map<number, number> = new Map()

  constructor(response: string) {
    super(null, response);

    for (let i = 0; i < 16; i++) {
      let area = parseInt(this.body.substring(i, i + 1), 10);

      if (area === 0) {
        continue;
      }

      this.keypadAreaAssignment.set(i + 1, area);

      if (this.areas.indexOf(area) === -1) {
        this.areas.push(area);
      }
    }
  }
}

/**
 * Keypad Key Change Update (KC).
 * 
 * @export
 * @class KeypadKeyChangeUpdate
 * @extends {ElkMessage}
 */
export class KeypadKeyChangeUpdate extends ElkMessage {
  
  /**
   * 
   * 
   * @type {number}
   */
  keypadId: number;
  key: Key;
  F1: IlluminationStatus;
  F2: IlluminationStatus;
  F3: IlluminationStatus;
  F4: IlluminationStatus;
  F5: IlluminationStatus;
  F6: IlluminationStatus;
  BypassCodeRequired: boolean;

  constructor(response: string) {
    super(null, response);

    this.keypadId = +this.body.substring(0, 2);
    this.key = Key[this.body.substring(2, 4)];
    this.F1 = IlluminationStatus[this.body.substring(4, 5)];
    this.F2 = IlluminationStatus[this.body.substring(5, 6)];
    this.F3 = IlluminationStatus[this.body.substring(6, 7)];
    this.F4 = IlluminationStatus[this.body.substring(7, 8)];
    this.F5 = IlluminationStatus[this.body.substring(8, 9)];
    this.F6 = IlluminationStatus[this.body.substring(9, 10)];
    this.BypassCodeRequired = +this.body.substring(10, 11) === 1 ? true : false;

    // TODO: Figure out chime mode one of these days
    // const chimeData = parseInt(this.body.substring(11, 18), 16);

    // this.physicalStatus = PhysicalStatus[status & 0x03];
    // this.logicalState = LogicalState[status >> 2];
  }
}

/**
 * Represents System Log Data Update (LD)
 * 
 * @export
 * @class LogDataUpdate
 * @extends {ElkMessage}
 */
export class LogDataUpdate extends ElkMessage {
  logIndex: string;
  event: string;
  /**
   * Event number data, i.e. Zone number, User number, etc.
   * 
   * @type {number}
   */
  id: number;
  areaId: number;
  hour: string;
  minute: string;
  month: string;
  day: number;
  dayOfWeek: string;
  year: string;

  constructor(response: string) {
    super(null, response);

    this.event = this.getEventType(+this.body.substring(0, 4));
    this.id = +this.body.substring(4, 7);
    this.areaId = +this.body.substring(7, 8);
    this.hour = this.body.substring(8, 10);
    this.minute = this.body.substring(10, 12);
    this.month = Month[+this.body.substring(12, 14)];
    this.day = +this.body.substring(14, 16);
    this.logIndex = this.body.substring(16, 19);
    this.dayOfWeek = WeekDay[+this.body.substring(19, 20)];
    this.year = this.body.substring(20, 22);
  }

  getEventType(event: number): string {
    if (event >= 4001 && event <= 4208) {
      return `Zone ${event - 4000} Status: ${event === 1 ? 'violated' : 'normal'}`;
    } else if (event >= 5001 && event <= 5208) {
      return `Zone ${event - 4000}  Bypassed: ${event === 1 ? 'bypassed' : ''}`;
    } else if (event >= 6001 && event <= 6208) {
      return `Alarm Memory: ${event === 1 ? 'alarm activated' : ''}`;
    } else if (event >= 7001 && event <= 7208) {
      return `Output ${event - 4000}  Status: ${event === 1 ? 'On' : 'Off'}`;
    } else {
      return EventType.get(event.toString());
    }
  }
}

/**
 * Represents an Output Change Update (CC). This message is sent in response to an output
 * status change. Message contains the output number and the new state.
 * @export
 * @class OutputChangeUpdate
 * @extends {ElkMessage}
 */
export class OutputChangeUpdate extends ElkMessage {
  id: number;
  state: string;

  constructor(response: string) {
    super(null, response);

    this.id = +this.body.substring(0, 3);
    this.state = this.body.substring(3, 4) === '1' ? 'On' : 'Off';
  }
}

/**
 * Represents a Control Output Status Report (CS). This message is sent in response to a
 * Control Output Status Request.
 * @export
 * @class OutputStatusReport
 * @extends {ElkMessage}
 */
export class OutputStatusReport extends ElkMessage {
  /**
   * Array of output status'. Index 0 = Output 1.
   * 
   * @type {string[]}
   */
  outputs: string[] = [];

  constructor(response: string) {
    super(null, response);

    for (let i = 0; i < 208; i++) {
      let status = this.body.substring(i, i + 1) === '0' ? 'Off' : 'On';
      this.outputs.push(status);
    }
  }
}

/**
 * Represents Temerature Reply Data (LW), in reponse to a temperature request. 
 * 
 * @export
 * @class TemperatureReply
 * @extends {ElkMessage}
 */
export class TemperatureReply extends ElkMessage {
  /**
   * Array of keypad temps, 1-16. Index 0 = keypad 1.
   * 
   * @type {number[]}
   */
  keypads: number[] = [];
  /**
   * Array of zone sensor temps, 1-16. Index 0 = zone 1.
   * 
   * @type {number[]}
   */
  zones: number[] = [];

  constructor(response: string) {
    super(null, response);;

    for (let i = 0; i <= 96; i += 3) {
      if (i < 48) {
        this.keypads.push(+this.body.substring(i, i + 3) - 40);
      } else if (i < 96) {
        this.zones.push(+this.body.substring(i, i + 3) - 60);
      }
    }
  }
}

/**
 * Represents a Thermostat Data Reply (TR).
 * 
 * @export
 * @class ThermostatReply
 * @extends {ElkMessage}
 */
export class ThermostatReply extends ElkMessage {
  id: string;
  mode: string;
  hold: boolean;
  fan: string;
  temperature: number;
  heatSetPoint: number;
  coolSetPoint: number;
  humidity: string;

  constructor(response: string) {
    super(null, response);

    let thermNo = this.body.substring(0, 2);
    this.id = thermNo === '0' ? 'Invalid' : parseInt(thermNo).toString();
    this.mode = ThermostatMode[this.body.substring(2, 3)];
    this.hold = !this.body.substring(3, 4);
    this.fan = this.body.substring(4, 5) === '0' ? 'Auto' : 'On';
    this.temperature = +this.body.substring(5, 7);
    this.heatSetPoint = parseFloat(this.body.substring(7, 9));
    this.coolSetPoint = parseFloat(this.body.substring(9, 11));
    let humidity = this.body.substring(11, 12);
    this.humidity = humidity === '0' ? 'No Data' : humidity;
  }
}

/**
 * Represents String Text Description (SD)
 * 
 * @export
 * @class TextStringDescriptionReport
 * @extends {ElkMessage}
 */
export class TextStringDescriptionReport extends ElkMessage {
  descriptionType: string;
  id: number;
  description: string;

  constructor(response: string) {
    super(null, response);

    this.descriptionType = TextDescriptionType[parseInt(this.body.substring(0, 2))];
    this.id = parseInt(this.body.substring(2, 5), 10);
    this.description = this.body.substring(5, this.body.length - 2).trim();
  }
}

/**
 * Represents a Task Change Update (TC). This message is sent when a task has
 * been activated.
 * @export
 * @class TaskChangeUpdate
 * @extends {ElkMessage}
 */
export class TaskChangeUpdate extends ElkMessage {
  taskNumber: number;

  constructor(response: string) {
    super(null, response);

    this.taskNumber = +this.body.substring(0, 3);
  }
}

/**
 * Represents a Zone Bypass Reply (ZB)
 * 
 * @export
 * @class ZoneBypass
 * @extends {ElkMessage}
 */
export class ZoneBypass extends ElkMessage {
  id: number;
  bypassed: boolean

  constructor(response: string) {
    super(null, response);

    this.id = +this.body.substring(0, 3);
    this.bypassed = this.body.substring(3, 4) === '1' ? true : false;
  }
}

/**
 * Represents a Zone Definition Report (ZD)
 * 
 * @export
 * @class ZoneDefinitionReport
 * @extends {ElkMessage}
 */
export class ZoneDefinitionReport extends ElkMessage {
  zones: ZoneDefinition[] = [];

  constructor(response: string) {
    super(null, response);

    for (let i = 0; i < 208; i++) {
      let def = this.body.substring(i, i + 1);
      this.zones.push(new ZoneDefinition(
        i + 1,
        zoneDefinition.get(def)
      ));
    }
  }
}

/**
 * Represents a Zone Voltage Report (ZV)
 * 
 * @export
 * @class ZoneVoltageReport
 * @extends {ElkMessage}
 */
export class ZoneVoltageReport extends ElkMessage {
  id: number;
  voltage: number

  constructor(response: string) {
    super(null, response);

    this.id = +this.body.substring(0, 3);
    this.voltage = +this.body.substring(3, 6) / 10;
  }
}

/**
 * Represents a Zone Change Update message (ZC). 
 * 
 * @export
 * @class ZoneChangeUpdate
 * @extends {ElkMessage}
 */
export class ZoneChangeUpdate extends ElkMessage {
  public id: number;
  public physicalStatus: string;
  public logicalState: string;

  constructor(response: string) {
    super(null, response);

    this.id = +this.body.substring(0, 3);
    // Parse Hex value into physical & logical state/status
    let status = parseInt(this.body.substring(3, 4), 16);
    this.physicalStatus = PhysicalStatus[status & 0x03];
    this.logicalState = LogicalState[status >> 2];
  }
}

/**
 * Represents Zone Status Report (ZS)
 * 
 * @export
 * @class ZoneStatusReport
 */
export class ZoneStatusReport extends ElkMessage {
  zones: any = [];

  constructor(response: string) {
    super(null, response);

    // Elk M1 supports up to 208 zones
    for (let z = 1; z <= 208; z++) {
      var status = parseInt(this.body.substring(z - 1, z), 16);
      this.zones.push({
        id: z,
        physicalStatus: PhysicalStatus[status & 0x03],
        logicalState: LogicalState[status >> 2]
      });
    }
  }
}

/**
 * Represents Zone Partition Report (ZP)
 * 
 * @export
 * @class ZonePartitionReport
 * @extends {ElkMessage}
 */
export class ZonePartitionReport extends ElkMessage {
  zones: any = [];

  constructor(response: string) {
    super(null, response);

    // Elk M1 supports up to 208 zones
    for (let z = 1; z <= 208; z++) {
      this.zones.push({
        id: z,
        partition: +this.body.substring(z - 1, z)
      });
    }
  }
}

