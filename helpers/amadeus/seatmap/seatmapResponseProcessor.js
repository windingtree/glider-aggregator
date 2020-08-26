const { logRQRS } = require('../logRQ');
const { reduceToObjectByKey } = require('../../parsers/');

const seatmapResponseProcessor = (response, originalOffers) => {
  const { data: _flights } = response;
  logRQRS(response,'seatmap-amadeus-response-1-unconverted');
  logRQRS(originalOffers,'seatmap-amadeus-response-2-originalOffers');
  let flightSeatmaps = {};

  _flights.forEach(_flight => {
    const { id, type, departure, arrival, carrierCode,number, flightOfferId, segmentId, decks: _decks } = _flight;
    let flightDecks = convertDecks(_decks);
    flightDecks.flightDetails={
      id:id,
      departure:departure,
      arrival:arrival,
      carrierCode:carrierCode,
      number:number,
      flightOfferId:flightOfferId,
      segmentId:segmentId
    };
    flightSeatmaps[segmentId] = flightDecks;
  });
  logRQRS(flightSeatmaps,'seatmap-amadeus-response-2-converted');
  return flightSeatmaps;
};

const getOriginalOfferId = (segmentId) =>{

}

const detectCabinLayout = (seats, width) => {
  //get list of seat numbers (e.g. '10A','12B', '13B',...), then extract only letter (->'A','B','B'), then remove duplicates (->'A','B')
  let uniqueColumns = [];
  let layout = seats.map(seat => {
    return seat.number;
  }).map(number => number.substr(number.length - 1, 1)).map(letter=>{if(!uniqueColumns.includes(letter)) uniqueColumns.push(letter);});

  layout = uniqueColumns.sort().join('');
  // layout = uniqueColumns;
  let colCount = layout.length;
  //check if cabin width is more than number of letters (columns)
  if (colCount < width) {
    //in this case we need to find a place when to put an aisle
    //narrow body planes will have 1 aisle (e.g. 'AB CD', 'ABC DEF')
    //wide body will have 2 aisles (e.b. 'AB CDE FG' or 'AB CD EF')
    let aisleCount = width - colCount;  //difference between number of used letters(columns) and cabin width = number of aisles
    let colGroupsCount = aisleCount + 1;  //divide cabin cols into 2(if there is 1 aisle) or 3(if 2 aisles), etc..
    let colsPerColGroup = Math.floor(width / colGroupsCount); //how many group of seats should there be
    let newLayout = [];
    for (let i = 1; i <= layout.length; i++) {
      newLayout.push(layout[i - 1]);
      // console.log(`i=${i}, colsPerColGroup:${colsPerColGroup}, i%colsPerColGroup=${i%colsPerColGroup}, newLayout.length:${newLayout.length},newLayout.length%colsPerColGroup:${newLayout.length%colsPerColGroup}`);
      if ((i % colsPerColGroup) === 0) {
        // console.log("Tutaj");
        newLayout.push(' ');
      }
    }
    layout = newLayout.join('');
  }
  return layout;
};

const convertDecks = (decks) => {
  let cabins=[];

  let optionCodesMap = {};

  decks.map(deck => {
    const { deckType, deckConfiguration, seats: _seats } = deck;
    const deckSeats = [];
    //get all seats and it's availability and price
    _seats.map(_seat => {
      deckSeats.push(convertSeat(_seat));
    });

    //now find those seats which are chargeable and for each unique price point, create new 'optionCode'


    deckSeats.map(seat => {
      let price = seat.price;
      if (seat.price.public > 0) {  //we only want to have a list of non-zero seat prices
        if (!optionCodesMap[seat.price.public]) { //price was not yet stored before
          let optionCode = 'seat' + Object.keys(optionCodesMap).length;
          optionCodesMap[seat.price.public] = Object.assign({ _id_: optionCode }, price);
        }
        seat.optionCode = optionCodesMap[seat.price.public]._id_;
      }
      delete seat.price;  //price not needed anymore in 'seat' element
    });

    const { width, length, startSeatRow, endSeatRow, startWingsX, endWingsX, startWingsRow, endWingsRow, exitRowsX } = deckConfiguration;

    let cabin = {
      name: deckType,
      layout: detectCabinLayout(deckSeats, width),
      firstRow: startSeatRow,
      lastRow: endSeatRow,
      wingFirst: startWingsRow,
      wingLast: endWingsRow,
      exitRows: [...(exitRowsX||[])],
      seats: [...deckSeats],
    };
    cabins.push(cabin);
  });

  let prices = hashValuesToArray(optionCodesMap);
  return { cabins: cabins, prices: reduceToObjectByKey(prices) };
};
const createPrice = (amount, currency, tax) => {
  return {
    currency: currency,
    public: Number(amount).toFixed(2),
    taxes: Number(tax).toFixed(2),
  };
};
const convertSeat = (seat) => {
  const { cabin, number, characteristicsCodes, travelerPricing: travelerPricings, coordinates } = seat;
  let mostRestrictedSeatAvailabilityStatus = true;

  let seatPrice = createPrice(0, '', 0);
  //iterate over all passengers
  travelerPricings.map(travelerPricing => {
    const { price, seatAvailabilityStatus } = travelerPricing;
    //if for any of passengers seat is not available - flag is as not available (most restrictive seat availability)
    mostRestrictedSeatAvailabilityStatus = mostRestrictedSeatAvailabilityStatus && seatAvailabilityStatus === 'AVAILABLE';
    if (price && Number(price.total) > 0 && seatPrice.public < Number(price.total)) {
      let tax = price.taxes.reduce((total, taxItem) => {
        return total + Number(taxItem.amount);
      }, 0);
      seatPrice = createPrice(price.total, price.currency, tax);
    }
  });

  return {
    number: number,
    available: mostRestrictedSeatAvailabilityStatus,
    characteristics: [...characteristicsCodes],
    price: seatPrice,
  };
};
const hashValuesToArray = (hashMap) => {
  let result = [];
  Object.keys(hashMap).map(key => result.push(hashMap[key]));
  return result;
};


module.exports.seatmapResponseProcessor = seatmapResponseProcessor;
