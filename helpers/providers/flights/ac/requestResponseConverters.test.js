const { processFlightSearchResponse } = require('./requestResponseConverters');
const assert = require('chai').assert;


describe('flights/ac/requestResponseConverters', () => {
  describe('processFlightSearchResponse', () => {
    const expectedOffer = {
      '_id_': 'KMJ2JF9E99-OfferID-1',
      'offerItems': [
        {
          '_id_': 'MV5QI3SE03-OfferItemID-1',
          '_value_': {
            'passengerReferences': 'HEKC43BL47-T1 Z1L8ZSBUS4-T2',
          },
        },
        {
          '_id_': 'FO99IW0YJR-OfferItemID-2',
          '_value_': {
            'passengerReferences': 'JPEX72Q0SK-T3',
          },
        },
      ],
      'expiration': '',
      'price': {
        'currency': 'CAD',
        'public': '1232.81',
        'commission': 0,
        'taxes': '207.96',
      },
      'pricePlansReferences': [
        {
          '_id_': 'HGU8FLGFVW-Basic',
          'flights': 'XUMDTGL3TQ-OD1',
        },
        {
          '_id_': 'HGU8FLGFVW-Basic',
          'flights': 'XUMDTGL3TQ-OD1',
        },
      ],
    };

    let expectedPricePlans = {
      'HGU8FLGFVW-Basic': {
        '_id_': 'HGU8FLGFVW-Basic',
        'name': 'Basic',
        'amenities': [
          'Checked bags for a fee',
          'No flight changes',
        ],
        'checkedBaggages': '',
      },
    };

    let expectedSegments = {
      'OOTY7GAP7F-SEG1':
        {
          '_id_': 'OOTY7GAP7F-SEG1',
          'operator': {
            'operatorType': 'airline',
            'iataCode': '',
            'iataCodeM': 'AC',
            'flightNumber': '855',
          },
          'origin': {
            'locationType': 'airport',
            'iataCode': 'LHR',
          },
          'destination': {
            'locationType': 'airport',
            'iataCode': 'YVR',
          },
          'splittedDepartureTime': '14:30',
          'splittedDepartureDate': '2020-11-03',
          'splittedArrivalTime': '16:05',
          'splittedArrivalDate': '2020-11-03',
          'Departure': {
            'AirportCode': 'LHR',
            'Date': '2020-11-03',
            'Time': '14:30',
            'Terminal': {
              'Name': '2',
            },
          },
          'Arrival': {
            'AirportCode': 'YVR',
            'Date': '2020-11-03',
            'Time': '16:05',
            'Terminal': {
              'Name': 'M',
            },
          },
          'MarketingCarrier': {
            'AirlineID': 'AC',
            'Name': 'Air Canada',
            'FlightNumber': '855',
            'ResBookDesigCode': 'K',
          },
          'OperatingCarrier': {
            'Disclosures': {
              'Description': {
                'Text': 'nqYjRvzwPpiatxTgPk4W7tezJWT2Vuj8iiMou+T0bOVV5BBmJmlzrgLXlmf1aSgTfvUtFDQeEhgKDZTaqDoQnl+VAaZIW3mh3fHhEszVOdfH9OEtN8moJR3FFCu/h4Ny2iQE2j8jcH4hw5Zeq2JkJJbLentREcc/lue0KpECGv3/avvXwvRZ0w==',
              },
            },
          },
          'Equipment': {
            'AircraftCode': '77W',
          },
          'ClassOfService': {
            'Code': 'K',
          },
          'FlightDetail': {
            'FlightDuration': {
              'Value': 'PT09H30M',
            },
            'Stops': {
              'StopQuantity': '0',
            },
          },
        },
    };


    it('should process 2ADT+1CHD RT search response correctly', async () => {
      const acResponse = require('../../../../test/mockresponses/flights/ac/acSearchRS_2ADT1CHD_Return.json');
      const actualResponse = await processFlightSearchResponse(acResponse.data);

      let actualOffer = actualResponse.offers[0];

      //assert price is correct
      assertOfferPrice(actualOffer.price, expectedOffer.price);

      //assert offer items
      assert.equal(actualOffer.offerItems.length, expectedOffer.offerItems.length);
      for (let i = 0; i < expectedOffer.offerItems.length; i++) {
        assertOfferItem(actualOffer.offerItems[i], expectedOffer.offerItems[i]);
      }

      //assert passenger types
      assertPassenger(actualResponse.passengers, 'HEKC43BL47-T1', 'ADT');
      assertPassenger(actualResponse.passengers, 'Z1L8ZSBUS4-T2', 'ADT');
      assertPassenger(actualResponse.passengers, 'JPEX72Q0SK-T3', 'CHD');

      //assert price plans and segments
      for (let i = 0; i < actualOffer.pricePlansReferences.length; i++) {
        let actualPricePlanRef = actualOffer.pricePlansReferences[i];
        let actualPricePlanRefId = actualPricePlanRef._id_;
        //find price plan definition (in response.pricePlans)
        let actualPricePlan = actualResponse.pricePlans.find(pricePlan => pricePlan._id_ === actualPricePlanRefId);
        assert.isNotNull(actualPricePlan, `Could not find price plan reference in actual response, pricePlanRefId:${actualPricePlanRefId}`);
        //assert price plan
        let expectedPricePlan = expectedPricePlans[actualPricePlanRefId];
        assertPricePlan(actualPricePlan, expectedPricePlan);

        //flights
        let combinationIds = actualPricePlanRef.flights.split(' ');
        assert.isNotEmpty(combinationIds);
        for (let f = 0; f < combinationIds.length; f++) {
          //find all segments that create combination from price plan
          let actualSegments = findSegmentsThatBelongToCombinationId(actualResponse, combinationIds[f]);
          assert.isNotEmpty(actualSegments);
          //compare those segments with expected segments
          actualSegments.forEach(actualSegment => {
            let expectedSegment = expectedSegments[actualSegment._id_];
            assert.isNotNull(expectedSegment);
            assert.deepEqual(actualSegment, expectedSegment);
          });
        }
      }
    });
  });
});

const findSegmentsThatBelongToCombinationId = (response, combinationId) => {
  let segmentIds = response.itineraries.combinations.find(row => row._id_ === combinationId)._items_;
  segmentIds = segmentIds.split(' ');
  let segments = [];
  segmentIds.forEach(segmentId => {
    segments.push(response.itineraries.segments.find(segment => segment._id_ === segmentId));
  });

  return segments;
};

const assertOfferPrice = ({ currency, public, commission, taxes }, { currency: expectedCurrency, public: expectedPrice, taxes: expectedTaxes, commission: expectedCommission }) => {
  assert.equal(currency, expectedCurrency);
  assert.equal(public, expectedPrice);
  assert.equal(taxes, expectedTaxes);
  assert.equal(commission, expectedCommission);
};

const assertOfferItem = (actualItem, expectedItem) => {
  assert.deepEqual(actualItem, expectedItem);
};

const assertPassenger = (actualPassengers, expectedPaxRef, expectedPassengerType) => {
  let actualPax = actualPassengers.find(elem => elem._id_ === expectedPaxRef);
  assert.isNotNull(actualPax);
  assert.equal(actualPax._id_, expectedPaxRef);
  assert.equal(actualPax.type, expectedPassengerType);
};

const assertPricePlan = (actualPricePlan, expectedPricePlan) => {
  assert.deepEqual(actualPricePlan, expectedPricePlan);
};
