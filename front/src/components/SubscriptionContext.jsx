import React, { createContext, useContext, useEffect, useState } from "react";
import SubscriptionExpiredModal from "./SubscriptionExpiredModal.jsx";

const SubscriptionContext = createContext({
  expired: false,
  setExpired: () => {},
});

export function useSubscription() {
  return useContext(SubscriptionContext);
}

export function SubscriptionProvider({ children }) {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function handleExpired() {
      setExpired(true);
    }

    window.addEventListener("subscription_expired", handleExpired);

    return () => {
      window.removeEventListener("subscription_expired", handleExpired);
    };
  }, []);

  const value = { expired, setExpired };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      {expired && <SubscriptionExpiredModal />}
    </SubscriptionContext.Provider>
  );
}
