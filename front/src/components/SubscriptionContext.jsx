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
  const [isClientPortal, setIsClientPortal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname || "";
    setIsClientPortal(path.startsWith("/client"));
  }, []);

  useEffect(() => {
    function handleExpired() {
      if (!isClientPortal) {
        setExpired(true);
      }
    }

    window.addEventListener("subscription_expired", handleExpired);

    return () => {
      window.removeEventListener("subscription_expired", handleExpired);
    };
  }, [isClientPortal]);

  const value = { expired, setExpired };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      {!isClientPortal && expired && <SubscriptionExpiredModal />}
    </SubscriptionContext.Provider>
  );
}
