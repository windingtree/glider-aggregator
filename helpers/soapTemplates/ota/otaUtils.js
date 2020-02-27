const mapGuestCounts = (guests) => guests
    .reduce((guestCounts, {AgeQualifyingCode, Count}) => `${guestCounts}
        <GuestCount AgeQualifyingCode="${AgeQualifyingCode}" Count="${Count}"/>`
    , '')

module.exports.mapGuestCounts = mapGuestCounts;