const analyzeButton = document.getElementById("analyzeButton");
const textInput = document.getElementById("textInput");
const inputSection = document.getElementById("inputSection");
const cardsSection = document.getElementById("cardsSection");
const resultHeader = document.getElementById("resultHeader");
const cardsContainer = document.getElementById("cardsContainer");
const resetButton = document.getElementById("resetButton");
const notification = document.getElementById("notification");

async function analyzeEmotion(text) {
    const apiUrl = "https://emotion-api-service-788378649542.europe-central2.run.app/predict";
    const payload = { instances: [text] };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        throw new Error("AI API error");
    }
    
    const data = await response.json();
    const predictions = data.predictions[0];
    let top = predictions[0];
    for (let i = 1; i < predictions.length; i++) {
        if (predictions[i].score > top.score) {
            top = predictions[i];
        }
    }
    return top.label;
}

async function getRecommendations(emotion) {
    const API_BASE_URL = "https://tuke-backend-app-gpdzabandzfmerd4.northeurope-01.azurewebsites.net/recommend";
    
    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emotion })
    });
    
    if (!response.ok) {
        throw new Error("Flask API error");
    }
    
    const data = await response.json();
    return data.tracks;
}

function showNotification(message, duration = 3000) {
    notification.textContent = message;
    notification.classList.add("show");
    setTimeout(() => {
        notification.classList.remove("show");
    }, duration);
}

analyzeButton.addEventListener("click", async () => {
    const text = textInput.value.trim();
    
    if (!text) {
        showNotification("Please enter some text.");
        return;
    }
    
    analyzeButton.textContent = "Analyzing...";
    analyzeButton.classList.add("loading");
    analyzeButton.disabled = true;
    
    try {
        const emotion = await analyzeEmotion(text);
        resultHeader.innerHTML = `<h3>Top 10 tracks for emotion: <em>${emotion}</em></h3>`;
        
        const tracks = await getRecommendations(emotion);
        
        if (!tracks || tracks.length === 0) {
            resultHeader.innerHTML += `<p>No tracks found for this emotion.</p>`;
            showNotification("No tracks found.");
            return;
        }
        
        tracks.forEach(track => {
            const div = document.createElement("div");
            div.className = "track-block";
            div.innerHTML = `
                <strong>${track.track}</strong> by ${track.artist}
                <div class="track-iframe">
                    <iframe src="https://open.spotify.com/embed/track/${track.spotify_id}"
                            width="400" height="200" frameborder="0"
                            allowtransparency="true" allow="encrypted-media">
                    </iframe>
                </div>
            `;
            cardsContainer.appendChild(div);
        });
        
        inputSection.style.display = "none";
        cardsSection.style.display = "block";
        
    } catch (err) {
        showNotification("Error: " + err.message);
    } finally {
        analyzeButton.classList.remove("loading");
        analyzeButton.textContent = "Analyze Emotion";
        analyzeButton.disabled = false;
    }
});

resetButton.addEventListener("click", () => {
    cardsContainer.innerHTML = "";
    resultHeader.innerHTML = "";
    cardsSection.style.display = "none";
    inputSection.style.display = "block";
    textInput.value = "";
});
