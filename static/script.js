document.getElementById('analyze-btn').addEventListener('click', async () => {
    const emailText = document.getElementById('email-text').value.trim();
    if (!emailText) {
        alert("Please paste an email to analyze.");
        return;
    }

    // UI Updates
    document.getElementById('results').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: emailText })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        
        // Hide loading, show results
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('results').classList.remove('hidden');

        // Update Classification Badge
        const classBadge = document.getElementById('class-badge');
        const llmClass = (data.llm_classification || "").toUpperCase().replace('_', ' ');
        
        if (llmClass.includes('NOT SPAM')) {
            classBadge.textContent = 'Not Spam';
            classBadge.className = 'badge not-spam';
        } else if (llmClass.includes('SPAM')) {
            classBadge.textContent = 'Spam';
            classBadge.className = 'badge spam';
        } else {
            classBadge.textContent = 'Not Spam';
            classBadge.className = 'badge not-spam';
        }

        // Update Priority Badge
        const priorityBadge = document.getElementById('priority-badge');
        const prio = data.final_priority;
        priorityBadge.textContent = prio.charAt(0) + prio.slice(1).toLowerCase(); // Capitalize
        
        if (prio.includes('HIGH')) priorityBadge.className = 'badge high';
        else if (prio.includes('MEDIUM')) priorityBadge.className = 'badge medium';
        else priorityBadge.className = 'badge low';

        // Update Reasoning
        document.getElementById('reasoning-text').textContent = data.reasoning;

    } catch (error) {
        console.error(error);
        alert("An error occurred. Check the backend console. Did you add the API Key in the .env?");
        document.getElementById('loading').classList.add('hidden');
    }
});
