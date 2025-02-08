![Status](https://img.shields.io/badge/Deprecated-brown)

> [!CAUTION]
> This repo is no longer maintained.

For your project, consider using the official consent feature delivered by XMTP. To learn more, see [Support spam-free inboxes](https://docs.xmtp.org/inboxes/user-consent/user-consent).

The documentation below is provided for historical reference only.

# Build a consent management system with XMTP

This guide will walk you through the creation of a consent management system. This system will allow users to control their consent preferences for your messages or notifications. By leveraging XMTP, this tutorial offers tools to build a consent management system that respects user preferences and protects their privacy.

![CleanShot 2024-08-15 at 09 48 08@2x](https://github.com/user-attachments/assets/504b4564-61eb-4158-98a7-162dee9e5c7c)

### Import libraries

Start by importing the necessary libraries. This includes React for the UI, XMTP for messaging, and ethers for Ethereum blockchain interaction.

```jsx [JavaScript]
import React, { useState } from "react";
import { Client } from "@xmtp/xmtp-js"; // XMTP client for messaging
import { ethers } from "ethers"; // Ethers for Ethereum interaction
```

### Connect the wallet

This function handles the connection to the user's Ethereum wallet using MetaMask or a similar wallet provider.

```jsx [JavaScript]
const connectWallet = async () => {
  if (typeof window.ethereum !== "undefined") {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      return provider.getSigner();
    } catch (error) {
      console.error("User rejected request", error);
    }
  } else {
    console.error("Metamask not found");
  }
};
```

### Get consent List

This function is triggered when the user wants to view their subscriptions. It connects to the wallet and fetches the consent list. The consent list is a log with all consent actions ordered by date. To get the list, we need to filter unique actions by address.

```jsx [JavaScript]
// Function to refresh the consent list
const refreshConsentList = async (client) => {
  // Fetch the consent list from the client
  let consentList = await client.contacts.refreshConsentList();

  // Create a unique consent list by removing duplicates
  let uniqueConsentList = consentList
    .slice() // Create a copy of the consent list
    .reverse() // Reverse the list to keep the latest consent
    .filter(
      // Filter out duplicates by checking if the current index is the first occurrence of the consent value
      (consent, index, self) =>
        index === self.findIndex((t) => t.value === consent.value),
    )
    .reverse(); // Reverse the list back to the original order

  // Sort the unique consent list based on the permission type
  uniqueConsentList = uniqueConsentList.sort((a, b) => {
    // If 'a' is allowed and 'b' is not, 'a' should come first
    if (a.permissionType === "allowed" && b.permissionType !== "allowed")
      return -1;
    // If 'a' is unknown and 'b' is not, 'b' should come first
    if (a.permissionType === "unknown" && b.permissionType !== "unknown")
      return 1;
    // If 'a' is denied and 'b' is not, 'b' should come first
    if (a.permissionType === "denied" && b.permissionType !== "denied")
      return 1;
    // If none of the above conditions are met, keep the original order
    return 0;
  });

  // Update the state with the unique and sorted consent list.
  setConsentList(uniqueConsentList);

  // Return the unique and sorted consent list
  return uniqueConsentList;
};
```

### Render consent table

Render the consent list in a table format, allowing users to see their current consent allowlist and denylist.

```jsx [JavaScript]
// Container for displaying the consent list
<div style={styles.ConsentContainer}>
  // Table for displaying allowed consents
  <div style={styles.ConsentTable}>
    // Conditionally render the 'Allowed' header if there are any allowed
    consents
    {consentList.length > 0 && <h2>Allowed</h2>}
    // Filter and map through the consentList to display allowed consents
    {consentList
      .filter((consent) => consent.permissionType === "allowed")
      .map((consent, index) => (
        // Display each allowed consent in a row with a deny option
        <div
          key={index}
          style={{ display: "flex", justifyContent: "space-between" }}>
          // Index of the consent in the list
          <span style={{ textAlign: "left" }}>{index + 1}.</span>
          // Value of the consent
          <span style={{ textAlign: "left" }}>{consent.value}</span>
          // Button to deny the consent
          <span
            style={{ color: "red", cursor: "pointer" }}
            onClick={() => handleDeny(consent.value)}>
            Deny
          </span>
        </div>
      ))}
  </div>
  // Table for displaying denied consents
  <div style={styles.ConsentTable}>
    // Conditionally render the 'Denied' header if there are any denied consents
    {consentList.length > 0 && <h2>Denied</h2>}
    // Filter and map through the consentList to display denied consents
    {consentList
      .filter((consent) => consent.permissionType === "denied")
      .map((consent, index) => (
        // Display each denied consent in a row with an allow option
        <div
          key={index}
          style={{ display: "flex", justifyContent: "space-between" }}>
          // Index of the consent in the list
          <span style={{ textAlign: "left" }}>{index + 1}.</span>
          // Value of the consent
          <span style={{ textAlign: "left" }}>{consent.value}</span>
          // Button to allow the consent
          <span
            style={{ color: "green", cursor: "pointer" }}
            onClick={() => handleAllow(consent.value)}>
            Allow
          </span>
        </div>
      ))}
  </div>
</div>
```

### Handle consent change

These functions manage the consent states by allowing or denying addresses.

```jsx [JavaScript]
// Function to handle allowing an address
const handleAllow = async (address) => {
  // Check if the client object is available
  if (client) {
    // Confirm with the user if they want to allow the address
    if (window.confirm("Are you sure you want to allow this address?")) {
      // Refresh the consent list before performing the allow action
      await refreshConsentList(client);
      // Perform the allow action on the address
      await client.contacts.allow([address]);
      // Refresh the consent list after performing the allow action
      await refreshConsentList(client);
      // Trigger the onSubscribe callback with the address and state
      onSubscribe(client.address, "allowed");
    }
  } else {
    // Log an error if the client object is not available
    console.error("Client is not set");
  }
};
// Function to handle denying an address
const handleDeny = async (address) => {
  // Check if the client object is available
  if (client) {
    // Confirm with the user if they want to deny the address
    if (window.confirm("Are you sure you want to deny this address?")) {
      // Refresh the consent list before performing the deny action
      await refreshConsentList(client);
      // Perform the deny action on the address
      await client.contacts.deny([address]);
      // Refresh the consent list after performing the deny action
      await refreshConsentList(client);
      // Trigger the onUnsubscribe callback with the address and state
      onUnsubscribe(client.address, "denied");
    }
  } else {
    // Log an error if the client object is not available
    console.error("Client is not set");
  }
};
```

### Download the consent list as a CSV file

This function generates and downloads the consent list as a CSV file.

```jsx [JavaScript]
const downloadCSV = async () => {
  const csvRows = ["Address,State"];
  consentList.forEach((consent) => {
    csvRows.push(`${consent.address},${consent.state}`);
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "consent_list.csv";
  link.click();
};
```

### Render the Component

Finally, combine all the parts to render the `ConsentManagement` component.

```jsx [JavaScript]
export function ConsentManagement({ env, onError }) {
  // State and other functions go here

  return (
    <div>
      <button onClick={handleClick}>Show Subscriptions</button>
      // Render the consent list table // Render Allow/Deny buttons
      <button onClick={downloadCSV}>Download CSV</button>
    </div>
  );
}
```

## Caution :warning:

**Always synchronize consent states:** Before updating consent preferences on the network, ensure you refresh the consent list with `refreshConsentList`. Update the network's consent list only in these scenarios:

- **User Denies Contact:** Set to `denied` if a user blocks or unsubscribes.
- **User Allows Contact:** Set to `allowed` if a user subscribes or enables notifications.
- **Legacy Preferences:** Align the network with any existing local preferences.
- **User Response:** Set to `allowed` if the user has engaged in conversation.

Neglecting these guidelines can result in consent state conflicts and compromise user privacy.
