// public/js/diet.js

// Wait for the DOM to be ready
$(document).ready(function() {
    // Assuming dietData is an array containing diet items for each day
    const dietData = [
        { day: '1', calories: 200 },
        // Add more diet items as needed
    ];

    // Function to update the diet items on the page
    function updateDietItems() {
        // Clear existing content
        $('#dietContainer').empty();

        // Group diet items by day
        const dietByDay = {};
        dietData.forEach(item => {
            if (!dietByDay[item.day]) {
                dietByDay[item.day] = [];
            }
            dietByDay[item.day].push(item);
        });

        // Append unordered lists for each day
        Object.keys(dietByDay).forEach(day => {
            const dietList = $('<ul>').append(
                dietByDay[day].map(item => $('<li>').text(`Calories: ${item.calories}`))
            );
            $('#dietContainer').append(`<h3>Day ${day}</h3>`, dietList);
        });
    }

    // Call the function to initially update the diet items
    updateDietItems();

    // Example of how to add a new item (you can adapt this based on your UI)
    $('#addDietItemButton').click(function() {
        const day = $('#dayInput').val();
        const calories = $('#caloriesInput').val();
        // Assuming you have a function to add diet items to the server (AJAX request)
        addDietItemToServer(day, calories);
        // Update the displayed diet items after adding a new item
        updateDietItems();
    });

    // Function to add diet items to the server (example)
    function addDietItemToServer(day, calories) {
        // Example: send an AJAX request to add the diet item to the server
        $.post('/addDiet', { day, calories }, function(data) {
            console.log('Diet item added to the server:', data);
        });
    }
});
