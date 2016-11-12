
/**
 * Represents an Area from an Arming Status Report.
 * 
 * @export
 * @class AreaReport
 */
export class AreaReport {
  constructor(
    public id: number,
    public armStatus: string,
    public armUpState: string,
    public alarmState: string) {

  }
}

/**
 * Represents a Zone Definition Report
 * 
 * @export
 * @class ZoneDefinition
 */
export class ZoneDefinition {
  constructor(
    public id: number,
    public definition: string
  ) {

  }
}