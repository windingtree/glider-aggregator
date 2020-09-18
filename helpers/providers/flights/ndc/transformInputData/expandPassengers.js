const expandPassengers = (passengers) => {
  var res = [];

  for(let p of passengers) {
    let paxCopy = Object.assign({}, p);
    // Create a default value
    if(!paxCopy.count) {
      res.push(paxCopy);
    }

    // Otherwise create one for each count
    else {
      const count = paxCopy.count;
      delete paxCopy.count;

      for(let i=0; i<count; i++) {
        res.push(paxCopy);
      }
    }
  }

  return res;
};
module.exports.expandPassengers = expandPassengers;
