
// Fetch the dictionary data from the JSON file
let dictionary = {};

fetch('dictionary.json')
  .then(response => response.json())
  .then(data => {
    dictionary = data;
  })
  .catch(error => console.error("Error loading dictionary:", error));

// Function to search word in the dictionary and show suggestions
function searchWord() {
  const searchBox = document.getElementById("search-box");
  const result = document.getElementById("result");
  const suggestions = document.getElementById("suggestions");
  const query = searchBox.value.trim().toLowerCase();

  // Hide suggestions and result if search box is empty
  if (query === "") {
    suggestions.style.display = "none";
    result.style.display = "none";
    return;
  }

  // Filter words from the dictionary based on the input
  const filteredWords = Object.keys(dictionary).filter(word => word.startsWith(query));

  // Show suggestions if there are any matching words
  if (filteredWords.length > 0) {
    suggestions.style.display = "block";
    suggestions.innerHTML = filteredWords.map(word => `<div onclick="showMeaning('${word}')">${word}</div>`).join('');
  } else {
    suggestions.style.display = "none";
  }

  // Check if the word exists in the dictionary
  if (dictionary[query]) {
    result.style.display = "block";
    result.innerHTML = `<b>${query}</b>: ${dictionary[query]}`;
  } else {
    result.style.display = "none";
  }
}

// Function to show the meaning of the selected word from suggestions
function showMeaning(word) {
  const result = document.getElementById("result");
  result.style.display = "block";
  result.innerHTML = `<b>${word}</b>: ${dictionary[word]}`;
  document.getElementById("search-box").value = word;  // Set the search box to the selected word
  document.getElementById("suggestions").style.display = "none";  // Hide suggestions after selection
}
