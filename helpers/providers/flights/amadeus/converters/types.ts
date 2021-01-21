export enum PassengerType{
    ADULT='ADT',
    CHILD='CHD',
    INFANT='INF'
}

export enum LocationType{
    airport='airport'
}


export interface Location {
    iataCode: string,
    locationType: LocationType
}
export enum OperatorType{
    airline='airline'
}
export interface Identity{
    _id_:string
}

export  interface Operator{
    operatorType:OperatorType,
    iataCode: string,
    iataCodeM?: string,
    flightNumber: string
}

export interface Segment extends Identity{
    operator: Operator,
    origin: Location,
    destination: Location,
    departureTime: Date,
    arrivalTime: Date,
}

export interface Price{
    currency: string,
    public: number
}

export interface PriceWithTax extends Price{
    taxes: number,
    commission: number
}

export enum Gender{
    male='MALE',
    female='FEMALE'
}
