document.addEventListener('DOMContentLoaded', function() {
    fetchData();
});

function fetchData() {
    const headers = new Headers({
        'Content-Type': 'application/json',
        // Add any other headers your API requires
    });

    fetch('https://localhost:8888/health', { headers }) // Replace with your API endpoint
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            displayData(data);
        })
        .catch(error => {
            console.error('Error fetching data: ', error);
            document.getElementById('data-container').innerHTML = '<p>Error loading data.</p>';
        });
}

function displayData(data) {
    // Assuming data is the JSON object { "message": "Healthy" }
    const message = data.message; // Extract the message from the data
    document.getElementById('data-container').innerHTML = `<p>${message}</p>`; // Display the message in the data-container element
}