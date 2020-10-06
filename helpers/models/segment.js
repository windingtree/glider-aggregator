class FlightOperator {
  constructor (operatorType, operatingCarrierCode, maerketingCarrierCode, flightNumber) {
    this._operatorType = operatorType;
    this._operatingCarrierCode = operatingCarrierCode;
    this._maerketingCarrierCode = maerketingCarrierCode;
    this._flightNumber = flightNumber;
  }

  get operatorType () {
    return this._operatorType;
  }

  set operatorType (value) {
    this._operatorType = value;
  }

  get operatingCarrierCode () {
    return this._operatingCarrierCode;
  }

  set operatingCarrierCode (value) {
    this._operatingCarrierCode = value;
  }

  get maerketingCarrierCode () {
    return this._maerketingCarrierCode;
  }

  set maerketingCarrierCode (value) {
    this._maerketingCarrierCode = value;
  }

  get flightNumber () {
    return this._flightNumber;
  }

  set flightNumber (value) {
    this._flightNumber = value;
  }

  static fromJSON (json) {
    return new FlightOperator(json.operatorType, json.iataCode, json.iataCodeM, json.flightNumber);
  }

  toJSON () {
    return {
      operatorType: this._operatorType,
      iataCode: this._operatingCarrierCode,
      iataCodeM: this._maerketingCarrierCode,
      flightNumber: this._flightNumber,
    };
  }
}

class Location {
  constructor (locationType, iataCode) {
    this._locationType = locationType;
    this._iataCode = iataCode;
  }

  get locationType () {
    return this._locationType;
  }

  set locationType (value) {
    this._locationType = value;
  }

  get iataCode () {
    return this._iataCode;
  }

  set iataCode (value) {
    this._iataCode = value;
  }

  static fromJSON (json) {
    return new Location(json.locationType, json.iataCode);
  }

  toJSON () {
    return {
      locationType: this.locationType,
      iataCode: this.iataCode,
    };
  }
}

class Segment {
  constructor (origin, destination, operator, departureDateTime, arrivalDateTime) {
    this._origin = origin;
    this._destination = destination;
    this._operator = operator;
    this._departureDateTime = departureDateTime;
    this._arrivalDateTime = arrivalDateTime;
  }

  get origin () {
    return this._origin;
  }

  set origin (value) {
    this._origin = value;
  }

  get destination () {
    return this._destination;
  }

  set destination (value) {
    this._destination = value;
  }

  get operator () {
    return this._operator;
  }

  set operator (value) {
    this._operator = value;
  }

  get departureDateTime () {
    return this._departureDateTime;
  }

  set departureDateTime (value) {
    this._departureDateTime = value;
  }

  get arrivalDateTime () {
    return this._arrivalDateTime;
  }

  set arrivalDateTime (value) {
    this._arrivalDateTime = value;
  }

  toJSON () {
    return {
      operator: this.operator,
      origin: this.origin,
      destination: this.destination,
      departureTime: this.departureDateTime,
      arrivalTime: this.arrivalDateTime,
    };
  }
}

module.exports = { FlightOperator, Location, Segment };
