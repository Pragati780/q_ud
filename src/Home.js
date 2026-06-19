import React, { useEffect, useState, useCallback } from "react";
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
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;

      const words = transcript.split(" ");

      const amountWord = words.find((word) => !isNaN(word));

      if (amountWord) {
        setAmount(Number(amountWord));
      }

      const customer = words.filter((word) => isNaN(word)).join(" ");

      setCustomerName(customer);
    };
  };

  const addUdhaarQuick = async (value) => {
    try {
      const docRef = await addDoc(customersCollectionRef, {
        name: customerName,
        amount: value,
        createdAt: new Date(),
      });

      setCustomers([
        ...customers,
        {
          id: docRef.id,
          name: customerName,
          amount: value,
        },
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  // Add Udhaar Entry
  const addUdhaar = async () => {
    if (!customerName || !amount) {
      alert("Please fill all fields");
      return;
    }

    try {
      console.log("Starting add...");

      const docRef = await addDoc(customersCollectionRef, {
        name: customerName,
        amount: Number(amount),
        createdAt: new Date(),
      });

      console.log("Document written with ID:", docRef.id);

      // Immediately update local UI
      setCustomers([
        ...customers,
        {
          id: docRef.id,
          name: customerName,
          amount: Number(amount),
        },
      ]);

      setCustomerName("");
      setAmount("");

      alert("Added successfully!");
    } catch (err) {
      console.error("FULL FIREBASE ERROR:", err);

      alert(err.message);
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

  return (
    <div className="Home">
      <div className="nav">
        <div className="title">
          <h1>QuickUdhaar</h1>
          <p>Built for small kirana stores during rush-hour billing</p>
        </div>
      </div>

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

          <button className="voice-btn" onClick={startVoiceInput}>
            🎤 Quick Voice Entry
          </button>

          <input
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          {!rushMode && (
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          )}

          <div className="quick-buttons">
            <button
              onClick={() => {
                setAmount(10);

                if (rushMode && customerName) {
                  addUdhaarQuick(10);
                }
              }}
            >
              ₹10
            </button>
            <button
              onClick={() => {
                setAmount(20);

                if (rushMode && customerName) {
                  addUdhaarQuick(20);
                }
              }}
            >
              ₹20
            </button>
            <button
              onClick={() => {
                setAmount(50);

                if (rushMode && customerName) {
                  addUdhaarQuick(50);
                }
              }}
            >
              ₹50
            </button>
            <button
              onClick={() => {
                setAmount(100);

                if (rushMode && customerName) {
                  addUdhaarQuick(100);
                }
              }}
            >
              ₹100
            </button>
          </div>

          <button onClick={addUdhaar}>Add Udhaar</button>
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
              {customers.map((customer) => {
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
