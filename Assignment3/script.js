const form = document.getElementById("feedbackForm");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const courseInput = document.getElementById("course");
const feedbackInput = document.getElementById("feedback");

const sessionUser = document.getElementById("sessionUser");
const storedData = document.getElementById("storedData");

function showError(id, message) {
    document.getElementById(id).innerText = message;
}

function clearError(id) {
    document.getElementById(id).innerText = "";
}

function validateEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

nameInput.addEventListener("input", () => {
    if (nameInput.value.trim() !== "") {
        clearError("nameError");
    }
});

emailInput.addEventListener("input", () => {
    if (validateEmail(emailInput.value)) {
        clearError("emailError");
    }
});

courseInput.addEventListener("change", () => {
    if (courseInput.value !== "") {
        clearError("courseError");
    }
});

feedbackInput.addEventListener("input", () => {
    if (feedbackInput.value.trim() !== "") {
        clearError("feedbackError");
    }
});

form.addEventListener("submit", function (e) {

    e.preventDefault();

    let isValid = true;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const course = courseInput.value;
    const feedback = feedbackInput.value.trim();

    if (name === "") {
        showError("nameError", "Name must contain atleast 3 letters.");
        isValid = false;
    } else {
        clearError("nameError");
    }

    if (email === "") {
        showError("emailError", "Email cannot be empty.");
        isValid = false;
    } else if (!validateEmail(email)) {
        showError("emailError", "Enter a valid email.");
        isValid = false;
    } else {
        clearError("emailError");
    }

    if (course === "") {
        showError("courseError", "Please select a course.");
        isValid = false;
    } else {
        clearError("courseError");
    }

    if (feedback === "") {
        showError("feedbackError", "Please enter feedback.");
        isValid = false;
    } else {
        clearError("feedbackError");
    }

    if (isValid) {

        const feedbackData = {
            name: name,
            email: email,
            course: course,
            feedback: feedback
        };

        localStorage.setItem(
            "feedback",
            JSON.stringify(feedbackData)
        );

        sessionStorage.setItem(
            "studentName",
            name
        );

        displayData();

        alert("Feedback submitted successfully!");
    }
});

function displayData() {

    const data = JSON.parse(
        localStorage.getItem("feedback")
    );

    if (data) {

        storedData.innerHTML = `
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Course:</strong> ${data.course}</p>
            <p><strong>Feedback:</strong> ${data.feedback}</p>
        `;

    } else {

        storedData.innerHTML = "No feedback stored.";
    }

    const user = sessionStorage.getItem("studentName");

    if (user) {
        sessionUser.innerText =
            "Current Session User: " + user;
    } else {
        sessionUser.innerText =
            "Current Session User: None";
    }
}

document.getElementById("deleteBtn").addEventListener("click", function () {

    localStorage.clear();
    sessionStorage.clear();

    storedData.innerHTML = "No feedback stored.";
    sessionUser.innerText = "Current Session User: None";
});

displayData();