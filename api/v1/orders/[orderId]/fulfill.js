const { basicDecorator } = require('../../../../decorators/basic');
const GliderError = require('../../../../helpers/error');
const { createFlightProvider } = require('../../../../helpers/providers/providerFactory');
const { ordersManager } = require('../../../..//helpers/models/order');

const { reduceToObjectByKey, reduceToProperty } = require('../../../../helpers/parsers');
const { getGuarantee, claimGuarantee, claimGuaranteeWithCard } = require('../../../../helpers/guarantee');


module.exports = basicDecorator(async (req, res) => {
  const { body, query } = req;
  const { orderId } = query;

  // Get the order
  const order = await ordersManager.getOrder(query.orderId);


  if (order.offer && order.offer.extraData && order.offer.extraData.mappedPassengers) {
    body.passengerReferences = body.passengerReferences
      .map(p => order.offer.extraData.mappedPassengers[p]);
  } else {
    throw new GliderError(
      'Mapped passengers Ids not found in the offer',
      500,
    );
  }

  // Get the guarantee and verify
  const guarantee = await getGuarantee(body.guaranteeId, {
    currency: order.order.order.price.currency,
    amountAfterTax: order.order.order.price.public,
  });
  //claim
  let guaranteeClaim = await claimGuaranteeWithCard(body.guaranteeId);


  let provider = order.provider;
  let providerImpl = createFlightProvider(provider);
  let fulfillResults = await providerImpl.orderFulfill(orderId, order, body, guaranteeClaim);

  fulfillResults.travelDocuments.etickets = reduceToObjectByKey(fulfillResults.travelDocuments.etickets);
  fulfillResults.travelDocuments.etickets = reduceToProperty(fulfillResults.travelDocuments.etickets, '_passenger_');

  //FIXME - do we need to claim after or before fulfill call?
  if (!guaranteeClaim) {
    guaranteeClaim = await claimGuarantee(body.guaranteeId);
  }

  await ordersManager.saveOrder(
    body.orderId,
    {
      request: body,
      guarantee: guarantee,
      guaranteeClaim: guaranteeClaim,
      order: fulfillResults,
      offer: order.offer,
    },
  );

  res.status(200).json(fulfillResults);
});
