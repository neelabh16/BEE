const students = [
  { id: 101, name: "Aman", marks: 82, course: "Java" },
  { id: 102, name: "Priya", marks: 95, course: "Python" },
  { id: 103, name: "Rahul", marks: 67, course: "Java" },
  { id: 104, name: "Neha", marks: 76, course: "Web" },
  { id: 105, name: "Rohan", marks: 88, course: "Python" }
];

console.log("Original Array:");
console.log(students);

// (1) Push
students.push({
  id: 106,
  name: "Simran",
  marks: 91,
  course: "Java"
});

console.log("\nTask 1 - After Push:");
console.log(students);

// (2) Pop
const removedLast = students.pop();

console.log("\nTask 2 - Removed Student:");
console.log(removedLast);

// (3) Unshift
students.unshift({
  id: 100,
  name: "Ankit",
  marks: 80,
  course: "Web"
});

console.log("\nTask 3 - After Unshift:");
console.log(students);


// (4) Shift
const removedFirst = students.shift();

console.log("\nTask 4 - Removed First Student:");
console.log(removedFirst);


// (5) splice()
const index = students.findIndex(student => student.id === 103);

students.splice(index, 1, {
  id: 107,
  name: "Karan",
  marks: 78,
  course: "Java"
});

console.log("\nTask 5 - After Splice:");
console.log(students);

// (6) slice()
const firstThree = students.slice(0, 3);

console.log("\nTask 6 - First Three Students:");
console.log(firstThree);


// (7) Array Iteration (for...of)
console.log("\nTask 7 - Student Details:");

for (const student of students) {
  console.log(`${student.name} - ${student.course} - ${student.marks}`);
}

// (8) forEach()
console.log("\nTask 8 - Student Names:");

students.forEach(student => {
  console.log(student.name);
});

// (9) map()
const studentNames = students.map(student => student.name);

console.log("\nTask 9 - Student Names Array:");
console.log(studentNames);

// (10) filter()
const topStudents = students.filter(student => student.marks >= 80);

console.log("\nTask 10 - Students with Marks >= 80:");
console.log(topStudents);

// (11) reduce()
const totalMarks = students.reduce((sum, student) => sum + student.marks, 0);
const averageMarks = totalMarks / students.length;

console.log("\nTask 11:");
console.log("Total Marks =", totalMarks);
console.log("Average Marks =", averageMarks);


// (12) sort()
const ascending = [...students].sort((a, b) => a.marks - b.marks);

console.log("\nTask 12 - Ascending Marks:");
ascending.forEach(student => console.log(student.marks));


const descending = [...students].sort((a, b) => b.marks - a.marks);

console.log("\nTask 12 - Descending Marks:");
descending.forEach(student => console.log(student.marks));