module.exports.mapGuestCounts = (guests) => guests
  .reduce(
    (
      guestCounts,
      {
        AgeQualifyingCode,
        Count
      }
    ) => `${guestCounts}
    <GuestCount AgeQualifyingCode="${AgeQualifyingCode}" Count="${Count}"/>`,
    ''
  );
