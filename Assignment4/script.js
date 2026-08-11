// Change to false to test rejection
let seatsAvailable = true;

// Create Promise
let booking = new Promise((resolve, reject) => {
    console.log("Checking seat availability...");

    setTimeout(() => {
        if (seatsAvailable) {
            resolve("Seats Available");
        } else {
            reject("No Seats Available");
        }
    }, 2000);
});

// Promise Chaining
booking
    .then((result) => {
        console.log(result);
        console.log("Processing Payment...");
        return "Payment Successful";
    })
    .then((result) => {
        console.log(result);
        console.log("Confirming Booking...");
        return "Booking Confirmed";
    })
    .then((result) => {
        console.log(result);
        console.log("Generating Ticket...");
        return "Ticket Generated Successfully";
    })
    .then((result) => {
        console.log(result);
    })
    .catch((error) => {
        console.log("Error:", error);
    });