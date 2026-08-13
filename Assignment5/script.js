// Function that returns a Promise
function calculateResult() {

    // Promise represents a value that will be available in the future
    return new Promise((resolve) => {

        // setTimeout() delays the execution by 3 seconds (3000 ms)
        setTimeout(() => {

            // resolve() completes the Promise successfully
            resolve("Your result is ready! You scored 100 marks.");

        }, 3000);
    });
}

// async function allows the use of await inside it
async function checkResult() {

    const result = document.getElementById("result");

    // Display message immediately
    result.innerText = "Calculating your result...";

    // await pauses the function until the Promise is resolved
    const message = await calculateResult();

    // Display the final result
    result.innerText = message;
}