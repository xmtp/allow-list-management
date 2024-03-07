import React, { useState, useEffect } from "react";
import { Client } from "@xmtp/xmtp-js";
import { ethers } from "ethers";
import { init, useQuery } from "@airstack/airstack-react";
// Initialize Airstack with your API key
init(process.env.REACT_APP_AIRSTACK_API_KEY);

// ConsentManagement component for managing user consents
export function ConsentManagement({
  onSubscribe,
  onUnsubscribe,
  onError,
  env,
  label = "Show subscriptions",
}) {
  // State variables for loading, consent list and client
  const [loading, setLoading] = useState(false);
  const [consentList, setConsentList] = useState([]);
  const [client, setClient] = useState(null);
  const [wallets, setWallets] = useState([]);
  const addresses = consentList
    .filter((consent) => consent.value !== null && consent.value.trim() !== "")
    .map((consent) => consent.value);

  const query = `query MyQuery {
    # Get All Web3 socials (Lens/Farcaster)
    Socials(
      input: {
        filter: {
          identity: {
            _in: ${JSON.stringify(addresses)}
          }
        },
        blockchain: ethereum
      }
    ) {
      Social {
        userAssociatedAddresses
        dappName
        profileName
      }
    }
    # Get All ENS domains, including offchain Namestone & cb.id
    Domains(
      input: {
        filter: {
          resolvedAddress: {
            _in: ${JSON.stringify(addresses)}
          }
        },
        blockchain: ethereum
      }
    ) {
      Domain {
        resolvedAddress
        name
        isPrimary
      }
    }
  }`;
  const { data, loading: queryLoading, error } = useQuery(query);
  // Extract the addresses from the consentList
  // Styles for the component
  const styles = {
    SubscribeButtonContainer: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      borderRadius: "5px",
      alignItems: "center",
    },
    SubscribeButton: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px 20px",
      borderRadius: "5px",
      marginBottom: "2px",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
      fontWeight: "bold",
      color: "#333333",
      backgroundColor: "#ededed",
      border: "none",
      fontSize: "12px",
    },
    ConsentContainer: {
      display: "flex",
      justifyContent: "space-between",
    },
    ConsentTable: {
      width: "400px", // or any other fixed width
      margin: "10px",
    },
    labelBubble: {
      padding: "5px 10px",
      borderRadius: "15px",
      fontSize: "12px",
      color: "white",
      margin: "2px",
      display: "inline-block",
    },
    farcasterLabel: {
      backgroundColor: "#8a63d2", // Purple
    },
    lensLabel: {
      backgroundColor: "rgb(195, 228, 205)", // Green
    },
    ensDomainLabel: {
      backgroundColor: "#03A9F4", // Light Blue
    },
  };
  useEffect(() => {
    const processData = async () => {
      console.log("entra2", data);
      if (!queryLoading && !error && data) {
        // Process and set the address resolutions based on the fetched data
        const newResolutions = {};
        // Process Socials
        for (const consent of consentList) {
          const address = consent.value.toLowerCase(); // Convert to lowercase

          for (const social of data.Socials.Social) {
            if (
              social.userAssociatedAddresses
                .map((address) => address.toLowerCase()) // Convert to lowercase
                .includes(address)
            ) {
              if (!newResolutions[address]) {
                newResolutions[address] = { socials: [], domains: [] };
              }
              console.log("entra", consent.value);
              newResolutions[address].socials.push({
                dappName: social.dappName,
                profileName: social.profileName,
              });
            }
          }

          for (const domain of data.Domains.Domain) {
            if (domain.resolvedAddress.toLowerCase() === address) {
              if (!newResolutions[address]) {
                newResolutions[address] = { socials: [], domains: [] };
              }
              newResolutions[address].domains.push({
                name: domain.name,
                isPrimary: domain.isPrimary,
              });
            }
          }
        }
        // Merge newResolutions into consentList to form wallets
        const wallets = consentList.map((consent) => {
          const address = consent.value.toLowerCase();
          const resolution = newResolutions[address];
          return {
            ...consent,
            socials: resolution ? resolution.socials : [],
            domains: resolution ? resolution.domains : [],
          };
        });
        setWallets(wallets);
      }
    };
    processData();
  }, [data, queryLoading, error]);
  // Function to connect to the wallet
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

  // Function to handle click event
  const handleClick = async () => {
    try {
      setLoading(true);
      let wallet = await connectWallet();
      let client = await Client.create(wallet, { env: env });
      setClient(client);
      await refreshConsentList(client);
      setLoading(false);
    } catch (error) {
      if (typeof onError === "function") onError(error);
      console.log(error);
    }
  };

  // Define the handleClick function
  const handleSubscribe = async () => {
    try {
      const senderAddress = "0x1ca66c990e86b750ea6b2180d17fff89273a5c0d";
      // Set loading to true
      setLoading(true);
      // Refresh the consent list before performing the allow action
      await refreshConsentList(client);

      // Get the consent state of the subscriber
      let state = client.contacts.consentState(senderAddress);
      // If the state is unknown or blocked, allow the subscriber
      if (state === "unknown" || state === "denied") {
        // Perform the allow action on the address
        console.log(state, senderAddress);
        await client.contacts.allow([senderAddress]);
        // Refresh the consent list after performing the allow action
        await refreshConsentList(client);
      } else if (state === "allowed") {
        state = "denied";
        await client.contacts.deny([senderAddress]);
      }

      // Refresh the consent list before performing the allow action
      await refreshConsentList(client);
      // Get the consent state of the subscriber
      state = client.contacts.consentState(senderAddress);
      console.log(state);
      // Set loading to false
      setLoading(false);
    } catch (error) {
      // If onError function exists, call it with the error
      if (typeof onError === "function") onError(error);
      // Log the error
      console.log(error);
    }
  };

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

    // Update the state with the unique and sorted consent list
    setConsentList(uniqueConsentList);

    // Return the unique and sorted consent list
    return uniqueConsentList;
  };

  // Function to download the consent list as a CSV file
  const downloadCSV = async () => {
    const csvRows = [];
    const headers = ["Address", "State"];
    csvRows.push(headers.join(","));

    const list = await refreshConsentList(client);
    for (const consent of list) {
      csvRows.push(`${consent.value},${consent.permissionType}`);
    }

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.download = "consent_list.csv";
    link.href = url;
    link.click();
  };

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

  function renderAddressBubbles(address, socials, domains) {
    // Shorten the address for display
    const shortAddress = `${address.substring(0, 6)}...${address.substring(
      address.length - 4,
    )}`;
    const notFound = socials.length === 0 && domains.length === 0;
    if (domains.length === 0) return null; // Do not render if there are no domains

    return (
      <div style={{ display: "flex", flexWrap: "wrap", overflow: "auto" }}>
        {notFound ? (
          <span style={{ ...styles.labelBubble, backgroundColor: "#757575" }}>
            {shortAddress}
          </span>
        ) : (
          <>
            {socials.map((social, index) => {
              let style = { ...styles.labelBubble };
              if (social.dappName.toLowerCase() === "farcaster") {
                style = { ...style, ...styles.farcasterLabel };
              } else if (social.dappName.toLowerCase() === "lens") {
                style = { ...style, ...styles.lensLabel };
              } else {
                style = { ...style };
              }
              return (
                <span key={index} style={style}>
                  {social.profileName}
                </span>
              );
            })}
            {domains.map((domain, index) => (
              <span
                key={index}
                style={{ ...styles.labelBubble, ...styles.ensDomainLabel }}>
                {domain.name}
              </span>
            ))}
          </>
        )}
      </div>
    );
  }

  return (
    <div
      style={styles.SubscribeButtonContainer}
      className={`Subscribe ${loading ? "loading" : ""}`}>
      <button style={styles.SubscribeButton} onClick={handleClick}>
        {loading ? "Loading... " : label}
      </button>
      {wallets.length > 0 && (
        <button style={styles.SubscribeButton} onClick={downloadCSV}>
          Download CSV
        </button>
      )}
      {wallets.length > 0 && (
        <button style={styles.SubscribeButton} onClick={handleSubscribe}>
          Test
        </button>
      )}
      <div style={styles.ConsentContainer}>
        <div style={styles.ConsentTable}>
          {wallets.length > 0 && <h2>Allowed</h2>}
          {wallets
            .filter(
              (consent) =>
                consent.permissionType === "allowed" &&
                consent.domains.length > 0,
            )
            .map((consent, index) => (
              <div
                key={index}
                style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ textAlign: "left" }}>{index + 1}.</span>
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    margin: "10px 0",
                  }}>
                  {renderAddressBubbles(
                    consent.value,
                    consent.socials,
                    consent.domains,
                  )}
                </div>
                <span
                  style={{ color: "red", cursor: "pointer" }}
                  onClick={() => handleDeny(consent.value)}>
                  Deny
                </span>
              </div>
            ))}
        </div>
        <div style={styles.ConsentTable}>
          {wallets.length > 0 && <h2>Denied</h2>}
          {wallets
            .filter(
              (consent) =>
                consent.permissionType === "denied" &&
                consent.domains.length > 0,
            )
            .map((consent, index) => (
              <div
                key={index}
                style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ textAlign: "left" }}>{index + 1}.</span>{" "}
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    margin: "10px 0",
                  }}>
                  {renderAddressBubbles(
                    consent.value,
                    consent.socials,
                    consent.domains,
                  )}
                </div>
                <span
                  style={{ color: "green", cursor: "pointer" }}
                  onClick={() => handleAllow(consent.value)}>
                  Allow
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
