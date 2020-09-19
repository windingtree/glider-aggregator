module.exports = class FlightProvider {
  constructor () {
    console.log('FlightProvider constructor');
  }

  search (itinerary, passengers) {
    //TODO add validation
    return this.flightSearch(itinerary, passengers);
  }

  // eslint-disable-next-line no-unused-vars
  async flightSearch (itinerary, passengers) {
    throw new Error('This method must be implemented in subclass');
  }

  // eslint-disable-next-line no-unused-vars
  async retrieveSeatmaps (offers) {
    throw new Error('This method must be implemented in subclass');
  }

  // eslint-disable-next-line no-unused-vars
  async priceOffers (body, offers){
    throw new Error('This method must be implemented in subclass');
  }
  // eslint-disable-next-line no-unused-vars
  async orderCreate (offer, requestBody, guaranteeClaim){
    throw new Error('This method must be implemented in subclass');
  }

  getProviderID (){
    throw new Error('This method must be implemented in subclass');
  }
};
