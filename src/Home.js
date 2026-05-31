import React, { useEffect, useState } from "react";
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

  const customersCollectionRef = collection(db, "customers");

  // Fetch Customers
  const getCustomers = async () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPending = customers.reduce(
    (total, customer) => total + customer.amount,
    0
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

          <input
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <div className="quick-buttons">
            <button onClick={() => setAmount(10)}>₹10</button>
            <button onClick={() => setAmount(20)}>₹20</button>
            <button onClick={() => setAmount(50)}>₹50</button>
            <button onClick={() => setAmount(100)}>₹100</button>
          </div>

          <button onClick={addUdhaar}>
            Add Udhaar
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
              {customers.map((customer) => {
                return (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>

                    <td>₹{customer.amount}</td>
                    
                    <td>
  {customer.createdAt
    ? new Date(
        customer.createdAt.seconds * 1000
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