// const  { airCanadaConfig } = require('../../config');

module.exports.provideSeatAvailabilityTransformTemplate_AC = {
  seatMaps: [
    '//SeatAvailabilityRS/SeatMap',
    {
      segmentKey: 'concat(SegmentRef/@OnPoint,"-",SegmentRef/@OffPoint)',
      cabins: [
        'Cabin',
        {
          name: 'CabinType/Name',
          layout: 'CabinLayout/Columns',
          firstRow: 'CabinLayout/Rows/First',
          lastRow: 'CabinLayout/Rows/Last',
          wingFirst: 'CabinLayout/WingPosition/FirstRow',
          wingLast: 'CabinLayout/WingPosition/LastRow',
          exitRows: [
            'CabinLayout/ExitRowPosition/RowPosition',
            'First'
          ],
          rows: [
            'Row',
            {
              number: 'Number',
              seats: [
                'Seat',
                {
                  number: 'Column',
                  available: 'boolean(SeatStatus="F")',
                  characteristics: [
                    'SeatCharacteristics/Code',
                    '.'
                  ],
                  optionCode: 'OfferItemRefs'
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  offers: [
    '//SeatAvailabilityRS/ALaCarteOffer',
    {
      _id_: '@OfferID',
      offerItems: [
        'ALaCarteOfferItem',
        {
          _id_: '@OfferItemID',
          serviceRef: 'Service/ServiceDefinitionRef',
          currency: 'UnitPriceDetail/TotalAmount/SimpleCurrencyPrice/@Code',
          public: 'UnitPriceDetail/TotalAmount/SimpleCurrencyPrice',
          taxes: 'UnitPriceDetail/Taxes/Total'
        }
      ]
    }
  ],
  services: [
    '//SeatAvailabilityRS/DataLists/ServiceDefinitionList/ServiceDefinition',
    {
      _id_: '@ServiceDefinitionID',
      name: 'Name'
    }
  ]
};

module.exports.FaultsTransformTemplate_AC = {
  errors: ['//soap:Fault', {
    message: 'faultstring',
    code: 'faultcode',
    date: `#${new Date().toISOString()}`
  }]
};

module.exports.ErrorsTransformTemplate_AC = {
  errors: ['//Errors', {
    message: 'Error',
    code: 'Error/@Code',
    type: 'Error/@Type'
  }]
};
