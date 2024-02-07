# Consent Management with XMTP

This guide will walk you through the creation of a consent management system. This system will allow users to control their consent preferences for your messages or notifications. By leveraging XMTP, this tutorial offers tools to build a consent management system that respects user preferences and protects their privacy.

https://github.com/fabriguespe/xmtp-ppp-consent-management/assets/1447073/453ec1ac-b531-4c8f-87e4-c8919748d43a

## Considerations

Before diving into the code let's consider important aspects while integrating consent features. For example, before making an allow or block action you should synchronize the updated consent list in order to **prevent overwriting network** consent from another app. For more details head to these sections of our docs:

- [Understand user consent preferences](https://xmtp.org/docs/build/user-consent#understand-user-consent-preferences): This section provides a comprehensive understanding of how user consent preferences are set, including but not limited to, direct actions within the app, settings adjustments, and responses to prompts.
- [Use consent preferences to respect user intent](https://xmtp.org/docs/build/user-consent#use-consent-preferences-to-respect-user-intent): Your app should aim to handle consent preferences appropriately because they are an expression of user intent.
- [Synchronize user consent preferences](https://xmtp.org/docs/build/user-consent#synchronize-user-consent-preferences):All apps that use the user consent feature must adhere to the logic described in this section to keep the consent list on the network synchronized with local app user consent preferences, and vice versa.

## Tutorial

Please refer to the XMTP documentation for comprehensive information regarding the implementation.

- [Import libraries](https://junk-range-possible-git-management-xmtp-labs.vercel.app/docs/tutorials/portable-consent/consent-mangement#import-libraries)

- [Connect the wallet](https://junk-range-possible-git-management-xmtp-labs.vercel.app/docs/tutorials/portable-consent/consent-mangement#connect-the-wallet)

- [Get consent List](https://junk-range-possible-git-management-xmtp-labs.vercel.app/docs/tutorials/portable-consent/consent-mangement#get-consent-list)

- [Render consent table](https://junk-range-possible-git-management-xmtp-labs.vercel.app/docs/tutorials/portable-consent/consent-mangement#render-consent-table)

- [Handle consent change](https://junk-range-possible-git-management-xmtp-labs.vercel.app/docs/tutorials/portable-consent/consent-mangement#handle-consent-change)

- [Download the consent list as a CSV file](https://junk-range-possible-git-management-xmtp-labs.vercel.app/docs/tutorials/portable-consent/consent-mangement#download-the-consent-list-as-a-csv-file)

- [Render the Component](https://junk-range-possible-git-management-xmtp-labs.vercel.app/docs/tutorials/portable-consent/consent-mangement#render-the-component)

## Caution :warning:

**Always synchronize consent states:** Before updating consent preferences on the network, ensure you refresh the consent list with `refreshConsentList`. Update the network's consent list only in these scenarios:

- **User Denies Contact:** Set to `denied` if a user blocks or unsubscribes.
- **User Allows Contact:** Set to `allowed` if a user subscribes or enables notifications.
- **Legacy Preferences:** Align the network with any existing local preferences.
- **User Response:** Set to `allowed` if the user has engaged in conversation.

Neglecting these guidelines can result in consent state conflicts and compromise user privacy.

## Conclusion

Consent has really evolved through the years. It started with email, then email marketing, and was the wild west until laws like GPDR stepped in. This is new chapter in the history of consent in a new era for privacy, portability, and ownership.
