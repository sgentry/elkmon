/// <reference path="../../typings/globals/mocha/index.d.ts" />
import {
  ArmingStatusReport,
  KeypadKeyChangeUpdate,
  EntryExitTime,
  LogDataUpdate,
  OutputChangeUpdate,
  OutputStatusReport,
  TemperatureReply,
  ThermostatReply,
  TextStringDescriptionReport,
  ZoneBypass,
  ZoneDefinitionReport,
  ZoneVoltageReport,
  ZoneChangeUpdate,
  ZonePartitionReport
} from '../../src/lib/messages';

import { expect } from 'chai';

describe('ArmingStatusReport', () => {
  var model: ArmingStatusReport;

  before(function() {
    model = new ArmingStatusReport('1EAS100000004000000030000000000E');
  });

  describe('parse #1', () => {
    it('Area id should be equal to 1', () => {
      expect(model.areas[0].id).to.equal(1);
    });
    it('Area 1 armStatus should be equal to \'Armed Away\'', () => {
      expect(model.areas[0].armStatus).to.equal('Armed Away');
    });
    it('Area 1 armUpState should be equal to \'Armed Fully\'', () => {
      expect(model.areas[0].armUpState).to.equal('Armed Fully');
    });
    it('Area 1 alarmState should be equal to \'Fire\'', () => {
      expect(model.areas[0].alarmState).to.equal('Fire');
    });
  });
});

describe('KeypadKeyChangeUpdate', () => {
  var model: KeypadKeyChangeUpdate;

  before(function() {
    model = new KeypadKeyChangeUpdate('19KC01112010000200000000010');
  });

  describe('parse', () => {
    it('Keypad id should be equal to 1', () => {
      expect(model.keypadId).to.equal(1);
    });
    it('Key should be equal to Asterisk', () => {
      expect(model.key).to.equal('Asterisk');
    });
    it('F1 illumination should be equal to Blinking', () => {
      expect(model.F1).to.equal('Blinking');
    });
    it('F2 illumination should be equal to Off', () => {
      expect(model.F2).to.equal('Off');
    });
    it('F3 illumination should be equal to On', () => {
      expect(model.F3).to.equal('On');
    });
    it('F4 illumination should be equal to Off', () => {
      expect(model.F4).to.equal('Off');
    });
    it('F5 illumination should be equal to Off', () => {
      expect(model.F5).to.equal('Off');
    });
    it('F6 illumination should be equal to Off', () => {
      expect(model.F6).to.equal('Off');
    });
    it('Bypass code required should be equal to false', () => {
      expect(model.BypassCodeRequired).to.equal(false);
    });
  });
});

describe('EntryExitTime', () => {
  var model: EntryExitTime;

  before(function() {
    model = new EntryExitTime('0FEE10060120100E5');
  });

  describe('parse', () => {
    it('Area id should be equal to 1', () => {
      expect(model.areaId).to.equal(1);
    });
    it('Timer type should be equal to Exit', () => {
      expect(model.timerType).to.equal('Exit');
    });
    it('Timer 1 should be equal to 60', () => {
      expect(model.timer1).to.equal(60);
    });
    it('Timer 2 should be equal to 120', () => {
      expect(model.timer2).to.equal(120);
    });
    it('Arm State should be equal to Armed Away', () => {
      expect(model.armedState).to.equal('Armed Away');
    });
  });
});

describe('LogDataUpdate', () => {
  var model: LogDataUpdate;

  before(function() {
    model = new LogDataUpdate('1CLD1193102119450607001505003F');
  });

  describe('parse', () => {
    it('event should be equal to \'AREA 3 IS ARMED STAY\'', () => {
      expect(model.event).to.equal('AREA 3 IS ARMED STAY');
    });
    it('event id should be equal to 102', () => {
      expect(model.id).to.equal(102);
    });
    it('event area id should be equal to 1', () => {
      expect(model.areaId).to.equal(1);
    });
    it('event hour should be equal to 19', () => {
      expect(model.hour).to.equal('19');
    });
    it('event minute should be equal to 45', () => {
      expect(model.minute).to.equal('45');
    });
    it('event month should be equal to \'June\'', () => {
      expect(model.month).to.equal('June');
    });
    it('event day should be equal to 7', () => {
      expect(model.day).to.equal(7);
    });
    it('event log index should be equal to 001', () => {
      expect(model.logIndex).to.equal('001');
    });
    it('event day of week should be equal to \'Thursday\'', () => {
      expect(model.dayOfWeek).to.equal('Thursday');
    });
    it('event year should be equal to \'05\'', () => {
      expect(model.year).to.equal('05');
    });
  });
});

describe('OutputChangeUpdate', () => {
  var model: OutputChangeUpdate;

  before(function() {
    model = new OutputChangeUpdate('0ACC003100E5');
  });

  describe('parse', () => {
    it('Output number should be equal to 3', () => {
      expect(model.id).to.equal(3);
    });
    it('Output state should be equal to \'On\'', () => {
      expect(model.state).to.equal('On');
    });
  });
});

describe('OutputStatusReport', () => {
  var model: OutputStatusReport;

  before(function() {
    model = new OutputStatusReport('D6CS1001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001008D');
  });

  describe('parse', () => {
    it('Output 1 status should be equal to \'On\'', () => {
      expect(model.outputs[0]).to.equal('On');
    });
    it('Output 2 status should be equal to \'Off\'', () => {
      expect(model.outputs[1]).to.equal('Off');
    });
    it('Output 4 status should be equal to \'On\'', () => {
      expect(model.outputs[3]).to.equal('On');
    });
    it('Output 208 status should be equal to \'On\'', () => {
      expect(model.outputs[207]).to.equal('On');
    });
  });
});

describe('TemperatureReply', () => {
  var model: TemperatureReply;

  before(function() {
    model = new TemperatureReply('66LW108109000000000000000000000000000000000000000000000000000000000000000000000000000000000000000130007A');
  });

  describe('parse', () => {
    it('Keypad 1 temp should be equal to 68', () => {
      expect(model.keypads[0]).to.equal(68);
    });
    it('Keypad 2 temp should be equal to 69', () => {
      expect(model.keypads[1]).to.equal(69);
    });
    it('Zone 16 temp should be equal to 70', () => {
      expect(model.zones[15]).to.equal(70);
    });
  });
});

describe('ThermostatReply', () => {
  var model: ThermostatReply;

  before(function() {
    model = new ThermostatReply('13TR01200726875000000');
  });

  describe('parse', () => {
    it('id should be equal to 1', () => {
      expect(model.id).to.equal('1');
    });
    it('mode should be equal to \'Cool\'', () => {
      expect(model.mode).to.equal('Cool');
    });
    it('hold should be equal to False', () => {
      expect(model.hold).to.equal(false);
    });
    it('fan should be equal to \'Auto\'', () => {
      expect(model.fan).to.equal('Auto');
    });
    it('Temperature should be equal to 72', () => {
      expect(model.temperature).to.equal(72);
    });
    it('Heat set point should be equal to 68', () => {
      expect(model.heatSetPoint).to.equal(68);
    });
    it('Cool set point should be equal to 75', () => {
      expect(model.coolSetPoint).to.equal(75);
    });
    it('Humidity should be equal to \'No Data\'', () => {
      expect(model.humidity).to.equal('No Data');
    });
  });
});

describe('TextStringDescriptionReport', () => {
  var model: TextStringDescriptionReport;

  before(function() {
    model = new TextStringDescriptionReport('1BSD01001Front DoorKeypad0089');
  });

  describe('parse', () => {
    it('type should be equal to Area', () => {
      expect(model.descriptionType).to.equal('Area');
    });
    it('Area id should be equal to 1', () => {
      expect(model.id).to.equal(1);
    });
    it('Description should be equal to Front DoorKeypad', () => {
      expect(model.description).to.equal('Front DoorKeypad');
    });
  });
});

describe('TextStringDescriptionReport > 99', () => {
  var model: TextStringDescriptionReport;

  before(function() {
    model = new TextStringDescriptionReport('1BSD01101Front DoorKeypad0089');
  });

  describe('parse', () => {
    it('type should be equal to Area', () => {
      expect(model.descriptionType).to.equal('Area');
    });
    it('Area id should be equal to 101', () => {
      expect(model.id).to.equal(101);
    });
    it('Description should be equal to Front DoorKeypad', () => {
      expect(model.description).to.equal('Front DoorKeypad');
    });
  });
});

describe('ZoneBypassReply', () => {
  var model: ZoneBypass;

  before(function() {
    model = new ZoneBypass('0AZB123100CC');
  });

  describe('parse', () => {
    it('zone id should be equal to 123', () => {
      expect(model.id).to.equal(123);
    });
    it('zone bypassed should be equal to true', () => {
      expect(model.bypassed).to.equal(true);
    });
  });
});

describe('ZoneDefinitionReport', () => {
  var model: ZoneDefinitionReport;

  before(function() {
    model = new ZoneDefinitionReport('D6ZD0010000011100000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007E');
  });

  describe('parse', () => {
    it('zone id should be equal to 3', () => {
      expect(model.zones[2].id).to.equal(3);
    });
    it('zone 3 definition should be equal to \'Burglar Entry/Exit 1\'', () => {
      expect(model.zones[2].definition).to.equal('Burglar Entry/Exit 1');
    });
    it('zone 33 definition should be equal to \'Burglar Interior Night\'', () => {
      expect(model.zones[32].definition).to.equal('Burglar Interior Night');
    });
  });
});

describe('ZoneVoltageReport', () => {
  var model: ZoneVoltageReport;

  before(function() {
    model = new ZoneVoltageReport('0CZV123072004E');
  });

  describe('parse', () => {
    it('zone id should be equal to 123', () => {
      expect(model.id).to.equal(123);
    });
    it('zone voltage should be equal to 7.2', () => {
      expect(model.voltage).to.equal(7.2);
    });
  });
});

describe('ZoneChangeUpdate', () => {
  var model: ZoneChangeUpdate;

  before(function() {
    model = new ZoneChangeUpdate('0AZC002200CE');
  });

  describe('parse', () => {
    it('zone id should be equal to 2', () => {
      expect(model.id).to.equal(2);
    });
    it('zone physicalStatus should be equal to EOL', () => {
      expect(model.physicalStatus).to.equal('EOL');
    });
    it('zone logicalState should be equal to Normal', () => {
      expect(model.logicalState).to.equal('Normal');
    });
  });
});

describe('ZonePartitionReport', () => {
  var model: ZonePartitionReport;

  before(function() {
    model = new ZonePartitionReport('D6ZP111211111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100AB');
  });

  describe('parse', () => {
    it('zone id should be equal to 1', () => {
      expect(model.zones[0].id).to.equal(1);
    });
    it('zone 1 partition should be equal to 1', () => {
      expect(model.zones[0].partition).to.equal(1);
    });
    it('zone 4 partition should be equal to 2', () => {
      expect(model.zones[3].partition).to.equal(2);
    });
  });
});

