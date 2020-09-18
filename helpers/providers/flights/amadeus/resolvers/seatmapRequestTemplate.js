const seatmapRequestTemplate = (offers) => {
  // fs.writeFileSync(`c://temp/log-${ts}-seatmap-rq-offers.json`, JSON.stringify(offers));
  let request = {
    data: [],
  };

  offers.map(offer => {
    request.data.push(offer.extraData.rawOffer);
  });

  return request;
};

module.exports.seatmapRequestTemplate = seatmapRequestTemplate;
