import React, { useState } from "react";
import { Client } from "@xmtp/xmtp-js";
import { ethers } from "ethers";

export function ConsentManagement({
  onSubscribe,
  onUnsubscribe,
  onError,
  env,
  label = "Show subscriptions",
}) {
  // State for loading status
  const [loading, setLoading] = useState(false);
  // State for consent list
  const [consentList, setConsentList] = useState([]);
  // State for client
  const [client, setClient] = useState(null);

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
      flexWrap: "wrap",
    },
    ConsentTable: {
      flex: "1 1 400px", // This will make the tables take up equal width and wrap to the next line on small screens
      margin: "10px",
    },
  };

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
  // Define the handleClick function
  const handleClick = async () => {
    try {
      // Set loading to true
      setLoading(true);
      // Get the subscriber
      let wallet = await connectWallet();
      let client = await Client.create(wallet, { env: env });
      setClient(client);
      // Set loading to false
      refreshConsentList(client);
      setLoading(false);
    } catch (error) {
      // If onError function exists, call it with the error
      if (typeof onError === "function") onError(error);
      // Log the error
      console.log(error);
    }
  };
  const refreshConsentList = async (client) => {
    // Get the consent list
    let consentList = await client.contacts.refreshConsentList();
    //let refreshList = await client.contacts.loadConsentList(); //this will only bring the ones not saved in cache.
    // Sort the consent list
    const uniqueConsentList = consentList
      .slice() // Create a copy of the array to avoid mutating the original data
      .reverse() // Reverse to keep the last appearance when filtering
      .filter(
        (consent, index, self) =>
          index === self.findIndex((t) => t.value === consent.value),
      )
      .reverse(); // Reverse again to restore the original order
    uniqueConsentList.sort((a, b) => {
      if (a.state === "allowed" && b.state !== "allowed") return -1;
      if (a.state === "unknown" && b.state !== "unknown") return 1;
      if (a.state === "denied" && b.state !== "denied") return 1;
      return 0;
    });
    // Set the consent list
    setConsentList(uniqueConsentList);
  };
  const handleAllow = async (address) => {
    if (client) {
      if (window.confirm("Are you sure you want to allow this address?")) {
        await client.contacts.allow([address]);
        refreshConsentList(client);
      }
    } else {
      console.error("Client is not set");
    }
  };

  const handleDeny = async (address) => {
    if (client) {
      if (window.confirm("Are you sure you want to deny this address?")) {
        await client.contacts.deny([address]);
        refreshConsentList(client);
      }
    } else {
      console.error("Client is not set");
    }
  };

  // In the render function
  return (
    <div
      style={styles.SubscribeButtonContainer}
      className={`Subscribe ${loading ? "loading" : ""}`}>
      <button style={styles.SubscribeButton} onClick={handleClick}>
        {loading ? "Loading... " : label}
      </button>
      <div style={styles.ConsentContainer}>
        <div style={styles.ConsentTable}>
          {consentList.length > 0 && <h2>Allowed</h2>}
          {consentList
            .filter((consent) => consent.permissionType === "allowed")
            .map((consent, index) => (
              <div
                key={index}
                style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ textAlign: "left" }}>{index + 1}.</span>
                <span style={{ textAlign: "left" }}>{consent.value}</span>
                <span
                  style={{ color: "red", cursor: "pointer" }}
                  onClick={() => handleDeny(consent.value)}>
                  Deny
                </span>
              </div>
            ))}
        </div>
        <div style={styles.ConsentTable}>
          {consentList.length > 0 && <h2>Denied</h2>}
          {consentList
            .filter((consent) => consent.permissionType === "denied")
            .map((consent, index) => (
              <div
                key={index}
                style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ textAlign: "left" }}>{index + 1}.</span>
                <span style={{ textAlign: "left" }}>{consent.value}</span>
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
