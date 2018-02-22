import Service from 'B.Net/Service';

export default function getViableProfile(types) {
  const typesArray = Array.isArray(types) ? types : [types];
  const profileRequests = typesArray.map(({ membershipId, membershipType }) => (
    Service.request({
      operationId: 'Destiny2.GetProfile',
      operationParams: {
        destinyMembershipId: membershipId,
        membershipType,
        components: [
          100,
          102,
          103,
          200,
          201,
          205,
          300,
          301,
          302,
          304,
          305,
          306,
          307,
          308,
        ].join(','),
      },
    // Reject to resolve Promise.all immediately.
    // Catch errors and pass them on.
    }).then(resp => Promise.reject(resp), error => Promise.resolve(error))
  ));

  return Promise
    .all(profileRequests)
    // Errors are only resolved if none of the requests are successful.
    .then(
      errors => Promise.reject(errors),
      profile => Promise.resolve(Object.freeze(profile)),
    );
}
