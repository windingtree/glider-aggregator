const hotelAvailTransformTemplate = {
  accommodations: [
    '/soap:Envelope/soap:Body/OTA_HotelAvailRS/HotelStays/HotelStay',
    {
      _provider_: '#erevmax',
      _id_: 'BasicPropertyInfo/@HotelCode',
      name: 'BasicPropertyInfo/@HotelName',
      type: '#hotel',
      description: 'BasicPropertyInfo/Address/TPA_Extensions/Description',
      location: {
        coordinates: {
          latitude: 'BasicPropertyInfo/Position/@Latitude',
          longitude: 'BasicPropertyInfo/Position/@Longitude',
        }
      },
      rating: 'BasicPropertyInfo/Award/@Rating',
      contactInformation: {
        phoneNumbers: [
          'BasicPropertyInfo/ContactNumbers/ContactNumber',
          '@PhoneNumber'
        ],
        emails: [
          'BasicPropertyInfo/Address/TPA_Extensions/Emails/Email',
          '@email_ID'
        ]
      },
      checkinoutPolicy: {
        checkinTime: 'BasicPropertyInfo/Policy/@CheckInTime',
        checkoutTime: 'BasicPropertyInfo/Policy/@CheckOutTime',
      },
      otherPolicies: [
        'BasicPropertyInfo/Address/TPA_Extensions/Policies/policy',
        {
          _id_: '@Policy_Type',
          _value_: '@Text',
        }
      ],
      media: [
        'BasicPropertyInfo/Address/TPA_Extensions/photos/photo',
        {
          type: '#photo',
          width: '@width',
          height: '@height',
          url: '@url',
        }
      ]
    }
  ],
  _roomStays_: [
    '/soap:Envelope/soap:Body/OTA_HotelAvailRS/RoomStays/RoomStay',
    {
      _provider_: '#erevmax',
      _hotelCode_: 'BasicPropertyInfo/@HotelCode',
      _roomRates_: [
        'RoomRates/RoomRate',
        {
          ratePlanReference: '@RatePlanCode',
          roomTypeReference: '@RoomTypeCode',
          effectiveDate: '@EffectiveDate',
          expireDate: '@ExpireDate',
          expireDateExclusiveInd: 'boolean(@ExpireDateExclusiveInd="true")',
          price: {
            currency: 'Total/@CurrencyCode',
            _afterTax_: 'Total/@AmountAfterTax',
            _beforeTax_: 'Total/@AmountBeforeTax',
          },
          rates: ['Rates/Rate', {
            rateTimeUnit: '@RateTimeUnit',
            effectiveDate: '@EffectiveDate',
            expireDate: '@ExpireDate',
            amountBeforeTax: 'Base/@AmountBeforeTax',
            amountAfterTax: 'Base/@AmountAfterTax',
            currencyCode: 'Base/@CurrencyCode'
          }]
        }
      ],
      _roomTypes_: [
        'RoomTypes/RoomType',
        {
          _id_: '@RoomTypeCode',
          name: 'RoomDescription/@Name',
          description: 'RoomDescription/Text',
          amenities: ['Amenities/Amenity', '@RoomAmenity'],
          size: {
            value: '@SizeMeasurement',
            _unit_: 'TPA_Extensions/Room_size_units'
          },
          maximumOccupancy: {
            adults: 'TPA_Extensions/MaxOccupancy/@MaxAdultOccupancy',
            childs: 'TPA_Extensions/MaxOccupancy/@MaxChildOccupancy',
          },
          media: ['TPA_Extensions/photos/photo', {
            type: '#photo',
            width: '@width',
            height: '@height',
            url: '@url',
          }],
          policies: ['TPA_Extensions/RoomPolicy/policy', {
            _id_: '@Policy_Type',
            _value_: '@Text',
          }]
        }
      ],
      _ratePlans_: [
        'RatePlans/RatePlan',
        {
          _id_: '@RatePlanCode',
          name: '@RatePlanName',
          penalties: {
            refund: {
              refundable: 'boolean(CancelPenalties/CancelPenalty/@NonRefundable = "false")',
            }
          }
        }
      ]
    }
  ]
};

const errorsTransformTemplate = {
  errors: [
    'soap:Envelope/soap:Body/OTA_HotelAvailRS/Errors/Error',
    {
      message: '@ShortText',
      code: '@Code',
    }
  ]
};

module.exports = {
  hotelAvailTransformTemplate,
  errorsTransformTemplate,
};
