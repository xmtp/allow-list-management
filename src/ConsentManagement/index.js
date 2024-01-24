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

  const styles = {
    SubscribeButtonContainer: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      borderRadius: "5px",
      textAlign: "center",
      alignItems: "center",
    },
    SubscribeButton: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px 20px",
      borderRadius: "5px",
      marginBottom: "2px",
      textAlign: "left",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
      fontWeight: "bold",
      color: "#333333",
      backgroundColor: "#ededed",
      border: "none",
      fontSize: "12px",
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

      // Get the consent list
      let consentList = await client.contacts.loadConsentList();
      // Sort the consent list
      consentList.sort((a, b) => {
        if (a.state === "allowed" && b.state !== "allowed") return -1;
        if (a.state === "unknown" && b.state !== "unknown") return 1;
        if (a.state === "blocked" && b.state !== "blocked") return 1;
        return 0;
      });

      console.log(consentList);
      // Set the consent list
      setConsentList(consentList);

      // Set loading to false
      setLoading(false);
    } catch (error) {
      // If onError function exists, call it with the error
      if (typeof onError === "function") onError(error);
      // Log the error
      console.log(error);
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
      {consentList.map((consent, index) => (
        <div key={index}>
          <span>
            {index + 1}. {consent.value}
          </span>
          <span>{consent.state === "allowed" ? "✖️" : "✔️"}</span>
        </div>
      ))}
    </div>
  );
}
