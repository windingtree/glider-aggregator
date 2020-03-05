const axios = require('axios');
const { transform } = require('camaro');

//const { airFranceConfig } = require('../../../config');
const config = require('../../../config');

const { basicDecorator } = require('../../../decorators/basic');
const { mapNdcRequestData } = require('../../../helpers/transformInputData/createOrder');
const { orderCreateRequestTemplate } = require('../../../helpers/soapTemplates/createOrder');
const { provideOrderCreateTransformTemplate, ErrorsTransformTemplate } = require('../../../helpers/camaroTemplates/provideOrderCreate');

const { 
  mergeHourAndDate, reduceToObjectByKey, useDictionary, reduceContactInformation, splitPropertyBySpace
} = require('../../../helpers/parsers');

const offer = require('../../../helpers/models/offer');
const hotelResolver = require('../../../helpers/resolvers/hotel/orderCreateWithOffer');


function returnCleanError(err, res) {
  if(err.code && err.message) {
    res.status(err.code).json({message: err.message});
  }

  // Default Error
  else {
    console.log(err);
    res.status(500).json({message: 'A server error occured ', details: err});
  }
}

module.exports = basicDecorator( async (req, res) => {
  const requestBody = req.body;

  // Retrieve the offer
  if(requestBody.offerId) {
    offer.offerManager.getOffer(requestBody.offerId)

    .then(storedOffer => {
      // Check if there is no offer returned
      if(storedOffer == null) {
        res.status(404).json({message: 'Offer expired or not found'});
      }

      // Handle an Accomodation offer
      if(storedOffer instanceof offer.AccommodationOffer) {
        // Resolve this query for an hotel offer
        hotelResolver(storedOffer, requestBody.passengers)
        .then(orderCreationResults => {
          res.send(orderCreationResults);
          //res.status(200).json(orderCreationResults);
        })
        .catch(err => {
          returnCleanError(err, res);
        });
      }

      // Handle a flight offer
      else if(storedOffer instanceof offer.FlightOffer) {

        // TODO: Move this to dedicated module
        const ndcRequestData = mapNdcRequestData(requestBody);
        const ndcBody = orderCreateRequestTemplate(ndcRequestData);
        axios.post(
          'https://ndc-rct.airfranceklm.com/passenger/distribmgmt/001451v01/EXT',
          ndcBody,
          {
            headers: {
              'Content-Type': 'text/xml;charset=UTF-8',
              'Accept-Encoding': 'gzip,deflate',
              SOAPAction: '"http://www.af-klm.com/services/passenger/ProvideOrderCreate/provideOrderCreate"',
              api_key: config.airFranceConfig.apiKey,
            },
          }
        )
        .then(response => {
          // Attempt to parse as a an error
          transform(response.data, ErrorsTransformTemplate)
          .then(errors => {
            // If an error is found, stop here
            if (errors.length) throw new Error(`${errors[0].message}`);

            // Otherwise parse as a result
            transform(response.data, provideOrderCreateTransformTemplate)
            .then(createResults => {
              createResults.order.itinerary.segments = 
              mergeHourAndDate(createResults.order.itinerary.segments, 'splittedDepartureDate', 'splittedDepartureTime', 'departureTime');
          
              createResults.order.itinerary.segments = 
              mergeHourAndDate(createResults.order.itinerary.segments, 'splittedArrivalDate', 'splittedArrivalTime', 'arrivalTime');
          
              createResults.order.itinerary.segments = reduceToObjectByKey(createResults.order.itinerary.segments);
          
              createResults.order.price.commission = createResults.order.price.commission.reduce((total, {value}) => total + parseFloat(value), 0).toString();
              createResults.order.price.taxes = createResults.order.price.taxes.reduce((total, {value}) => total + parseFloat(value), 0).toString();
          
              createResults.order.contactList = reduceToObjectByKey(createResults.order.contactList);
              createResults.order.passengers = useDictionary(createResults.order.passengers, createResults.order.contactList, 'contactInformation');
              createResults.order.passengers = splitPropertyBySpace(createResults.order.passengers, 'firstnames');
              createResults.order.passengers = splitPropertyBySpace(createResults.order.passengers, 'lastnames');
              createResults.order.passengers = reduceContactInformation(createResults.order.passengers);
              createResults.order.passengers = reduceToObjectByKey(createResults.order.passengers);
          
              delete createResults.order.contactList;
          
              res.status(200).json(createResults);
            })

          })
        })

      }

      // Handle other types of offer
      else {
        res.status(500).json({message: 'Unable to understand the offer type'});
      }
      
    })

    .catch(err => {
      // Handle Errors with a defined code and message
      returnCleanError(err, res);
    });
  }

  // Unable to find the offerId
  else {
    res.status(400).json({message: 'Missing mandatory field: offerId'});

  }
});