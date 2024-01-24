import React, { useState } from "react";
import { ConsentManagement } from "./ConsentManagement";

const InboxPage = () => {
  const [subscribeArray, setSubscribeArray] = useState([]);

  const styles = {
    homePageWrapper: {
      textAlign: "center",
      marginTop: "2rem",
    },
  };

  return (
    <div style={styles.homePageWrapper}>
      <h1>My Consent </h1>

      <ConsentManagement
        onSubscribe={(address, state) => {
          console.log("New subscriber: ", { address, state });
          setSubscribeArray((prevArray) => [...prevArray, { address, state }]);
        }}
        onUnsubscribe={(address, state) => {
          console.log("Unsubscribed: ", { address, state });
          setSubscribeArray((prevArray) => {
            const index = prevArray.findIndex((a) => a.address === address);
            if (index !== -1) {
              const newArray = [...prevArray];
              newArray[index].state = state;
              return newArray;
            }
            return prevArray;
          });
        }}
        onError={(error) => console.log("Error subscribing: " + error)}
        env="production"
      />
    </div>
  );
};

export default InboxPage;
