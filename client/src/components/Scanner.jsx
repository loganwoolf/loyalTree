import React, { useRef, useState, useEffect } from "react";

import axios from "axios";
import QrScanner from "qr-scanner";
import Button from "./Button";
import io from "socket.io-client";
import "./Scanner.css";

const Scanner = (props) => {
  const [socket, setSocket] = useState("");

  const previewEl = useRef(null);
  const outputEl = useRef(null);
  const qrScanner = useRef(null);
  const [cardAmt, setCardAmt] = useState(null);
  const [error, setError] = useState(null);
  const [transAmt, setTransAmt] = useState("");
  const [cardID, setCardID] = useState(null);
  const [transaction, setTransaction] = useState();
  const [day, setDay] = useState();
  const [scanBtnText, setScanBtnText] = useState("Click to Scan");
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    qrScanner.current = new QrScanner(previewEl.current, (result) => {
      console.log("decoded qr code:", result);
      cancelScan();
      setCardID(result);
      axios
        .get("/dashboard/redeem", { params: { cardID: result } })
        .then((response) => {
          // console.log(response.data);
          return response.data.error
            ? setError(response.data.error)
            : setCardAmt(response.data.balance);
        });
    });
  }, []);

  const cancelScan = () => {
    qrScanner.current.stop();
    setIsScanning(false);
    setScanBtnText("Click to Scan");
  };

  const startScan = () => {
    setScanBtnText("Cancel Scan");
    setIsScanning(true);
    setError(null);
    setCardAmt(null);
    qrScanner.current.start();
  };

  const scanButtonFunction = () => {
    isScanning ? cancelScan() : startScan();
  };

  const acceptTransaction = () => {
    axios
      .post("/dashboard/redeem", {
        cardID,
        transAmt,
        cardAmt,
      })
      .then((response) => {
        console.log("Success! Axios response:", response.data);
        setCardAmt(null);
        setError(null);
        setTransAmt("");
        setCardID(null);
        const time = new Date(response.data.created_at);
        setDay(time.toDateString());
        setTransaction(response.data);
      });
    setIsScanning(false);
    setScanBtnText("Click to Scan");
  };

  //----------------
  useEffect(() => {
    // Connect to server
    const socket = io("/");
    setSocket(socket);

    socket.on("connect", (event) => {
      console.log("this event superman event", transaction);
      // socket.emit("id", email);
    });

    // ensures we disconnect to avoid memory leaks
    return () => socket.disconnect();
  }, []);

  //-----------

  return (
    <div className="scanner">
      <p>Enter the total from the sale, then scan the customer's card.</p>
      <div className="amounts">
        <p>Sale Amount</p>
        <label htmlFor="redeem-amount">{transAmt || "--"}</label>
        <input
          value={transAmt}
          onChange={(e) => setTransAmt(e.target.value)}
          id="redeem-amount"
        />
        <p>Card Balance</p>
        <p ref={outputEl}>{cardAmt / 100 || "--"}</p>
      </div>

      {error && <p>{error}</p>}
      <Button onClick={scanButtonFunction} children={scanBtnText} />
      {cardAmt && (
        <Button onClick={acceptTransaction} children={"Accept transaction"} />
      )}
      <video
        className={"" + (isScanning ? "" : "hide")}
        ref={previewEl}
      ></video>
      {transaction && (
        <div className="transaction-container">
          <h3>Transaction Details</h3>
          <div className="transaction-details">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{transaction.id}</td>
                  <td>${(transaction.amount / 100) * -1}</td>
                  <td>{day}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
