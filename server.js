const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Define the path for storing grievances (e.g., inside a 'data' folder)
const grievancesFilePath = path.join(__dirname, 'data', 'grievances.json');

// --- Ensure the data directory and file exist ---
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}
if (!fs.existsSync(grievancesFilePath)) {
  fs.writeFileSync(grievancesFilePath, JSON.stringify([])); // Initialize with an empty array
}

// --- Route to handle grievance submissions from the client (your girlfriend's page) ---
app.post('/submit-grievance', (req, res) => {
  const newGrievance = {
    id: Date.now(), // Simple unique ID
    title: req.body.title,
    complaint: req.body.complaint,
    mood: req.body.mood,
    date: req.body.date
  };

  fs.readFile(grievancesFilePath, 'utf8', (err, data) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Error reading grievances file:', err);
      return res.status(500).send('Error reading grievance data.');
    }

    let grievances = [];
    if (data) {
      try {
        grievances = JSON.parse(data);
      } catch (parseErr) {
        console.error('Error parsing grievances file:', parseErr);
        return res.status(500).send('Error processing grievance data.');
      }
    }

    grievances.push(newGrievance);

    fs.writeFile(grievancesFilePath, JSON.stringify(grievances, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Error writing grievances file:', writeErr);
        return res.status(500).send('Error saving grievance.');
      }
      console.log('Grievance saved:', newGrievance); // Check your Glitch logs for this!
      res.status(200).send('Grievance submitted and saved successfully.');
    });
  });
});

// --- Route to view all grievances (Your Admin Panel) ---
// You will visit YOUR_PROJECT_NAME.glitch.me/admin/grievances to see these.
app.get('/admin/grievances', (req, res) => {
  fs.readFile(grievancesFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading grievances for admin view:', err);
      return res.status(500).send('Could not retrieve grievances.');
    }

    let grievances = [];
    try {
      grievances = JSON.parse(data);
    } catch (parseErr) {
      console.error('Error parsing grievances for admin view:', parseErr);
      return res.status(500).send('Error processing grievance data.');
    }

    let htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Grievance Admin Panel</title>
            <style>
                body { font-family: 'Quicksand', sans-serif; background-color: #f4f4f4; margin: 20px; color: #333; }
                .container { max-width: 800px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #ff4da6; text-align: center; font-family: 'Pacifico', cursive; }
                p { text-align: center; margin-bottom: 20px; }
                .grievance-item { background-color: #fff0f5; border: 1px solid #ff99cc; border-radius: 8px; padding: 15px; margin-bottom: 15px; position: relative; }
                .grievance-item strong { color: #e60073; }
                .grievance-item p { margin: 5px 0; text-align: left; }
                .no-grievances { text-align: center; color: #777; }
                .delete-button {
                  background-color: #ff4d4d;
                  color: white;
                  border: none;
                  padding: 8px 15px;
                  border-radius: 5px;
                  cursor: pointer;
                  position: absolute;
                  top: 10px;
                  right: 10px;
                  font-size: 14px;
                  transition: background-color 0.3s ease;
                }
                .delete-button:hover {
                  background-color: #cc0000;
                }
                .clear-all-button {
                    background-color: #ff9933;
                    color: white;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    margin-top: 20px;
                    display: block;
                    width: fit-content;
                    margin-left: auto;
                    margin-right: auto;
                    transition: background-color 0.3s ease;
                }
                .clear-all-button:hover {
                    background-color: #cc7a00;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Admin Panel: Grievances from Bhumika 💖</h1>
                <p>Hello, Anshul! Here are all the lovely notes from Bhumika:</p>
                <div id="grievancesList">`;

    if (grievances.length === 0) {
      htmlContent += `<p class="no-grievances">No grievances submitted yet, my love! All is well. 😊</p>`;
    } else {
      // Sort to show newest first
      grievances.sort((a, b) => new Date(b.date) - new Date(a.date));
      grievances.forEach(g => {
        htmlContent += `
                    <div class="grievance-item" id="grievance-${g.id}">
                        <button class="delete-button" onclick="deleteGrievance(${g.id})">Delete</button>
                        <p><strong>Title:</strong> ${g.title}</p>
                        <p><strong>Date:</strong> ${g.date}</p>
                        <p><strong>Mood:</strong> ${g.mood}</p>
                        <p><strong>Complaint:</strong> ${g.complaint}</p>
                    </div>
                `;
      });
    }

    htmlContent += `
                </div>
                <button class="clear-all-button" onclick="clearAllGrievances()">Clear All Grievances 🗑️</button>
            </div>
            <script>
                async function deleteGrievance(id) {
                    if (confirm('Are you sure you want to delete this specific grievance, my love?')) {
                        try {
                            const response = await fetch('/admin/delete-grievance', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ id: id })
                            });
                            if (response.ok) {
                                document.getElementById('grievance-' + id).remove();
                                alert('Grievance deleted successfully!');
                            } else {
                                alert('Failed to delete grievance. Please try again.');
                            }
                        } catch (error) {
                            console.error('Error deleting grievance:', error);
                            alert('An error occurred while deleting grievance.');
                        }
                    }
                }

                async function clearAllGrievances() {
                    if (confirm('Are you absolutely sure you want to clear ALL grievances? This cannot be undone!')) {
                        try {
                            const response = await fetch('/admin/clear-all-grievances', {
                                method: 'POST'
                            });
                            if (response.ok) {
                                document.getElementById('grievancesList').innerHTML = '<p class="no-grievances">No grievances submitted yet, my love! All is well. 😊</p>';
                                alert('All grievances cleared successfully!');
                            } else {
                                alert('Failed to clear all grievances. Please try again.');
                            }
                        } catch (error) {
                            console.error('Error clearing all grievances:', error);
                            alert('An error occurred while clearing all grievances.');
                        }
                    }
                }
            </script>
        </body>
        </html>
    `;
    res.send(htmlContent);
  });
});

// --- Route to delete a single grievance ---
app.post('/admin/delete-grievance', (req, res) => {
  const grievanceIdToDelete = req.body.id;

  fs.readFile(grievancesFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading grievances for deletion:', err);
      return res.status(500).send('Could not retrieve grievances for deletion.');
    }

    let grievances = [];
    try {
      grievances = JSON.parse(data);
    } catch (parseErr) {
      console.error('Error parsing grievances for deletion:', parseErr);
      return res.status(500).send('Error processing grievance data for deletion.');
    }

    const initialLength = grievances.length;
    const updatedGrievances = grievances.filter(g => g.id !== grievanceIdToDelete);

    if (updatedGrievances.length === initialLength) {
        return res.status(404).send('Grievance not found.');
    }

    fs.writeFile(grievancesFilePath, JSON.stringify(updatedGrievances, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Error writing updated grievances after deletion:', writeErr);
        return res.status(500).send('Error saving changes after deletion.');
      }
      console.log(`Grievance with ID ${grievanceIdToDelete} deleted.`);
      res.status(200).send('Grievance deleted successfully.');
    });
  });
});

// --- Route to clear all grievances ---
app.post('/admin/clear-all-grievances', (req, res) => {
  fs.writeFile(grievancesFilePath, JSON.stringify([]), (err) => {
    if (err) {
      console.error('Error clearing all grievances:', err);
      return res.status(500).send('Error clearing all grievances.');
    }
    console.log('All grievances cleared.');
    res.status(200).send('All grievances cleared successfully.');
  });
});

// --- Start the server ---
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
