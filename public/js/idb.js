// db connection
let db;

// variable connection to IndexedDB
const request = indexedDB.open("finacial_forecast", 1);

// database version updates
request.onupgradeneeded = function (event) {
  const db = event.target.result;
  // auto-incrementing primary key
  db.createObjectStore("new_transaction", { autoIncrement: true });
};

// successful
request.onsuccess = function (event) {
  db = event.target.result;
  console.log(db);

  // local db to api
  if (navigator.onLine) {
    console.log("Online!");
    uploadTransaction();
  }
};

// error
request.onerror = function (event) {
  console.log(event.target.errorCode);
};

// save for offline use
function saveRecord(record) {
  // new transaction with read and write permissions
  const transaction = db.transaction(["new_transaction"], "readwrite");
  // object store
  const fundsObjectStore = transaction.objectStore("new_transaction");
  // add record
  fundsObjectStore.add(record);
}
// Upload transaction when connected online
function uploadTransaction() {
  // open a transaction on your db
  const transaction = db.transaction(["new_transaction"], "readwrite");
  // access your object store
  const fundsObjectStore = transaction.objectStore("new_transaction");
  // get records from store
  const getAll = fundsObjectStore.getAll();
  // successful
  getAll.onsuccess = function () {
    // if indexedDb data send to the api
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "post",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open new transaction
          const transaction = db.transaction(["new_transaction"], "readwrite");
          // new transaction object store
          const fundsObjectStore = transaction.objectStore("new_transaction");
          // clear stored data
          fundsObjectStore.clear();

          alert("Transactions submitted!");
          window.location.reload();
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  //window checks for online connection
  window.addEventListener("online", uploadTransaction);
}
