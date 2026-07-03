import React, { useEffect, useState, useCallback, useRef } from "react";
import "./App.css";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "./Firebase";

export const Home = () => {
  const [customers, setCustomers] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("");
  const [rushMode, setRushMode] = useState(false);
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  const customerInputRef = useRef(null);

  const customersCollectionRef = collection(db, "customers");

  // Fetch Customers
  const getCustomers = useCallback(async () => {
    try {
      const data = await getDocs(customersCollectionRef);

      const filteredData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      setCustomers(filteredData);
    } catch (err) {
      console.error(err);
    }
  }, [customersCollectionRef]);

  // Auto-focus Customer Name whenever Rush Mode is switched on
  useEffect(() => {
    if (rushMode && customerInputRef.current) {
      customerInputRef.current.focus();
    }
  }, [rushMode]);

  // Auto-dismiss toast after 2.5s
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Voice Input
const startVoiceInput = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech recognition not supported in this browser");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    console.log("🎤 Listening...");
    setIsListening(true);
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;

    console.log("Transcript:", transcript);

    const words = transcript.split(" ");

    const amountWord = words.find((word) => !isNaN(word));

    if (amountWord) {
      setAmount(Number(amountWord));
    }

    const customer = words.filter((word) => isNaN(word)).join(" ");

    setCustomerName(customer);
  };

  recognition.onerror = (event) => {
    console.log("Speech Error:", event.error);
    setIsListening(false);
  };

  recognition.onend = () => {
    console.log("Speech Ended");
    setIsListening(false);
  };

  recognition.start();
};

  const resetFormAndRefocus = () => {
    setCustomerName("");
    setAmount("");
    setShowCustomAmount(false);

    setTimeout(() => {
      if (customerInputRef.current) {
        customerInputRef.current.focus();
      }
    }, 0);
  };

  const addUdhaarQuick = async (value) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const docRef = await addDoc(customersCollectionRef, {
        name: customerName,
        amount: value,
        createdAt: new Date(),
      });

      setCustomers((prev) => [
        ...prev,
        {
          id: docRef.id,
          name: customerName,
          amount: value,
          createdAt: { seconds: Math.floor(Date.now() / 1000) },
        },
      ]);

      showToast(`₹${value} added for ${customerName}`);
      resetFormAndRefocus();
    } catch (err) {
      console.error(err);
      showToast("Could not add entry. Try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Udhaar Entry
  const addUdhaar = async () => {
    if (isSubmitting) return;

    if (!customerName || !amount) {
      showToast("Please fill all fields", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const docRef = await addDoc(customersCollectionRef, {
        name: customerName,
        amount: Number(amount),
        createdAt: new Date(),
      });

      setCustomers((prev) => [
        ...prev,
        {
          id: docRef.id,
          name: customerName,
          amount: Number(amount),
          createdAt: { seconds: Math.floor(Date.now() / 1000) },
        },
      ]);

      showToast("Added successfully!");
      resetFormAndRefocus();
    } catch (err) {
      console.error("FULL FIREBASE ERROR:", err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete / Mark Paid
  const clearBalance = async (id) => {
    try {
      const customerDoc = doc(db, "customers", id);

      await deleteDoc(customerDoc);

      getCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getCustomers();
  }, [getCustomers]);

  const totalPending = customers.reduce(
    (total, customer) => total + customer.amount,
    0,
  );

  const handleQuickAmountClick = (value) => {
    setAmount(value);
    setShowCustomAmount(false);

    if (rushMode && customerName) {
      addUdhaarQuick(value);
    }
  };

  const handleFieldKeyDown = (e) => {
    if (e.key === "Enter" && !rushMode) {
      addUdhaar();
    }
  };

  const handleRecentCustomerClick = (name) => {
    setCustomerName(name);
  };

  // Last 5 unique customer names, most recently added first
  const recentCustomers = [...customers]
    .reverse()
    .reduce((acc, c) => {
      if (!acc.find((a) => a === c.name) && c.name) {
        acc.push(c.name);
      }
      return acc;
    }, [])
    .slice(0, 5);

  // Newest entries on top
  const sortedCustomers = [...customers].reverse();

  return (
    <div className="Home">
      <div className="nav">
        <div className="title">
          <h1>QuickUdhaar</h1>
          <p>Built for small kirana stores during rush-hour billing</p>
        </div>
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}

      <div className="container">
        <div className="form-card">
          <div className="balance">
            <p>Total Pending</p>
            <h1>₹{totalPending}</h1>
          </div>

          <h3>Add Udhaar Entry</h3>

          <button className="rush-btn" onClick={() => setRushMode(!rushMode)}>
            {rushMode ? "⚡ Rush Hour Mode ON" : "⚡ Enable Rush Hour Mode"}
          </button>

          <button
            className={`voice-btn ${isListening ? "listening" : ""}`}
            onClick={startVoiceInput}
          >
            {isListening ? "🎙️ Listening..." : "🎤 Quick Voice Entry"}
          </button>

          {rushMode && !isListening && (
            <p className="voice-helper-text">Try: "Rajesh 120"</p>
          )}

          <input
            ref={customerInputRef}
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            onKeyDown={handleFieldKeyDown}
          />

          {recentCustomers.length > 0 && (
            <div className="recent-customers">
              {recentCustomers.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="recent-customer-chip"
                  onClick={() => handleRecentCustomerClick(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {(!rushMode || showCustomAmount) && (
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={handleFieldKeyDown}
            />
          )}

          <div
            className={`quick-buttons ${rushMode ? "rush-quick-buttons" : ""}`}
          >
            <button
              disabled={isSubmitting}
              onClick={() => handleQuickAmountClick(10)}
            >
              ₹10
            </button>
            <button
              disabled={isSubmitting}
              onClick={() => handleQuickAmountClick(20)}
            >
              ₹20
            </button>
            <button
              disabled={isSubmitting}
              onClick={() => handleQuickAmountClick(50)}
            >
              ₹50
            </button>
            <button
              disabled={isSubmitting}
              onClick={() => handleQuickAmountClick(100)}
            >
              ₹100
            </button>
          </div>

          {rushMode && !showCustomAmount && (
            <button
              className="custom-amount-btn"
              onClick={() => setShowCustomAmount(true)}
            >
              + Custom Amount
            </button>
          )}

          <button
            className="add-udhaar-btn"
            onClick={addUdhaar}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Udhaar"}
          </button>
        </div>

        <div className="user-table">
          <h2>Pending Customers</h2>

          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Pending Amount</th>
                <th>Taken</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    No pending customers yet. Add your first Udhaar entry
                    above.
                  </td>
                </tr>
              ) : (
                sortedCustomers.map((customer) => {
                  return (
                    <tr key={customer.id}>
                      <td>{customer.name}</td>

                      <td>₹{customer.amount}</td>

                      <td>
                        {customer.createdAt
                          ? new Date(
                              customer.createdAt.seconds * 1000,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Now"}
                      </td>

                      <td>
                        <button
                          onClick={() =>
                            alert(`Reminder sent to ${customer.name}`)
                          }
                        >
                          Reminder
                        </button>

                        <button
                          style={{ marginLeft: "10px" }}
                          onClick={() => clearBalance(customer.id)}
                        >
                          Paid
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};