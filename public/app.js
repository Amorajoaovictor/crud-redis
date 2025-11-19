// API base URL
const API_URL = window.location.origin;

// State
let keys = [];
let selectedKey = null;
let isEditMode = false;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkConnection();
    loadKeys();
    setInterval(checkConnection, 10000); // Check connection every 10 seconds
});

// Check Redis connection
async function checkConnection() {
    try {
        const response = await fetch(`${API_URL}/api/health`);
        const data = await response.json();
        
        const statusElement = document.getElementById('connectionStatus');
        const statusDot = statusElement.querySelector('.status-dot');
        const statusText = statusElement.querySelector('.status-text');
        
        if (data.status === 'ok') {
            statusDot.className = 'status-dot connected';
            statusText.textContent = 'Connected';
        } else {
            statusDot.className = 'status-dot error';
            statusText.textContent = 'Disconnected';
        }
    } catch (error) {
        console.error('Connection check failed:', error);
        const statusElement = document.getElementById('connectionStatus');
        const statusDot = statusElement.querySelector('.status-dot');
        const statusText = statusElement.querySelector('.status-text');
        statusDot.className = 'status-dot error';
        statusText.textContent = 'Error';
    }
}

// Load all keys
async function loadKeys() {
    try {
        const response = await fetch(`${API_URL}/api/keys`);
        keys = await response.json();
        
        renderKeysList();
        updateDBInfo();
    } catch (error) {
        console.error('Error loading keys:', error);
        document.getElementById('keysList').innerHTML = 
            '<div class="loading" style="color: var(--danger-color);">Error loading keys</div>';
    }
}

// Render keys list
function renderKeysList() {
    const keysList = document.getElementById('keysList');
    
    if (keys.length === 0) {
        keysList.innerHTML = '<div class="loading">No keys found</div>';
        return;
    }
    
    const html = keys.map(item => `
        <div class="key-item ${selectedKey === item.key ? 'active' : ''}" 
             onclick="selectKey('${escapeHtml(item.key)}')">
            <div class="key-item-header">
                <div class="key-item-name">${escapeHtml(item.key)}</div>
            </div>
            <div class="key-item-meta">
                <span class="key-badge badge-${item.type}">${item.type}</span>
                ${item.ttl > 0 ? `<span style="font-size: 0.75rem; color: var(--text-tertiary);">TTL: ${item.ttl}s</span>` : ''}
            </div>
        </div>
    `).join('');
    
    keysList.innerHTML = html;
}

// Filter keys
function filterKeys() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const keyItems = document.querySelectorAll('.key-item');
    
    keyItems.forEach(item => {
        const keyName = item.querySelector('.key-item-name').textContent.toLowerCase();
        if (keyName.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Update database info
function updateDBInfo() {
    const dbInfo = document.getElementById('dbInfo');
    dbInfo.innerHTML = `<span class="db-size">${keys.length} keys</span>`;
}

// Select a key
async function selectKey(keyName) {
    try {
        const response = await fetch(`${API_URL}/api/keys/${encodeURIComponent(keyName)}`);
        const data = await response.json();
        
        selectedKey = keyName;
        renderKeyDetail(data);
        renderKeysList(); // Update active state
    } catch (error) {
        console.error('Error loading key:', error);
        alert('Error loading key details');
    }
}

// Render key detail
function renderKeyDetail(data) {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('keyDetail').style.display = 'block';
    
    document.getElementById('detailKeyName').textContent = data.key;
    
    const typeElement = document.getElementById('detailKeyType');
    typeElement.textContent = data.type;
    typeElement.className = `key-type key-badge badge-${data.type}`;
    
    const ttlElement = document.getElementById('detailKeyTTL');
    if (data.ttl > 0) {
        ttlElement.textContent = `TTL: ${data.ttl}s`;
        ttlElement.style.display = 'inline-block';
    } else if (data.ttl === -1) {
        ttlElement.textContent = 'No expiration';
        ttlElement.style.display = 'inline-block';
    } else {
        ttlElement.style.display = 'none';
    }
    
    const contentElement = document.getElementById('detailContent');
    contentElement.innerHTML = renderValue(data.type, data.value);
}

// Render value based on type
function renderValue(type, value) {
    switch (type) {
        case 'string':
            return `<div class="value-display">${escapeHtml(value)}</div>`;
        
        case 'hash':
            const hashRows = Object.entries(value).map(([key, val]) => `
                <tr>
                    <td>${escapeHtml(key)}</td>
                    <td>${escapeHtml(val)}</td>
                </tr>
            `).join('');
            return `
                <table class="value-table">
                    <thead>
                        <tr>
                            <th>Field</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>${hashRows}</tbody>
                </table>
            `;
        
        case 'list':
            const listRows = value.map((item, index) => `
                <tr>
                    <td>${index}</td>
                    <td>${escapeHtml(item)}</td>
                </tr>
            `).join('');
            return `
                <table class="value-table">
                    <thead>
                        <tr>
                            <th>Index</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>${listRows}</tbody>
                </table>
            `;
        
        case 'set':
            const setRows = value.map(item => `
                <tr>
                    <td>${escapeHtml(item)}</td>
                </tr>
            `).join('');
            return `
                <table class="value-table">
                    <thead>
                        <tr>
                            <th>Member</th>
                        </tr>
                    </thead>
                    <tbody>${setRows}</tbody>
                </table>
            `;
        
        case 'zset':
            const zsetRows = [];
            for (let i = 0; i < value.length; i += 2) {
                zsetRows.push(`
                    <tr>
                        <td>${escapeHtml(value[i])}</td>
                        <td>${value[i + 1]}</td>
                    </tr>
                `);
            }
            return `
                <table class="value-table">
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>${zsetRows.join('')}</tbody>
                </table>
            `;
        
        default:
            return '<div class="value-display">Unknown type</div>';
    }
}

// Show create modal
function showCreateModal() {
    isEditMode = false;
    document.getElementById('modalTitle').textContent = 'Create New Key';
    document.getElementById('keyName').value = '';
    document.getElementById('keyName').disabled = false;
    document.getElementById('keyType').value = 'string';
    document.getElementById('keyType').disabled = false;
    document.getElementById('keyTTL').value = '-1';
    document.getElementById('keyValue').value = '';
    updateValueInput();
    document.getElementById('createModal').classList.add('show');
}

// Edit key
function editKey() {
    if (!selectedKey) return;
    
    const keyData = keys.find(k => k.key === selectedKey);
    if (!keyData) return;
    
    isEditMode = true;
    document.getElementById('modalTitle').textContent = 'Edit Key';
    document.getElementById('keyName').value = selectedKey;
    document.getElementById('keyName').disabled = true;
    document.getElementById('keyType').value = keyData.type;
    document.getElementById('keyType').disabled = true;
    document.getElementById('keyTTL').value = keyData.ttl > 0 ? keyData.ttl : -1;
    
    // Set value based on type
    const valueInput = document.getElementById('keyValue');
    switch (keyData.type) {
        case 'string':
            valueInput.value = keyData.value;
            break;
        case 'hash':
            valueInput.value = JSON.stringify(keyData.value, null, 2);
            break;
        case 'list':
        case 'set':
            valueInput.value = JSON.stringify(keyData.value, null, 2);
            break;
        case 'zset':
            const zsetArray = [];
            for (let i = 0; i < keyData.value.length; i += 2) {
                zsetArray.push({ member: keyData.value[i], score: parseFloat(keyData.value[i + 1]) });
            }
            valueInput.value = JSON.stringify(zsetArray, null, 2);
            break;
    }
    
    updateValueInput();
    document.getElementById('createModal').classList.add('show');
}

// Close modal
function closeModal() {
    document.getElementById('createModal').classList.remove('show');
}

// Update value input based on type
function updateValueInput() {
    const type = document.getElementById('keyType').value;
    const hint = document.getElementById('valueHint');
    
    switch (type) {
        case 'string':
            hint.textContent = 'Enter a string value';
            break;
        case 'hash':
            hint.textContent = 'Enter JSON object, e.g., {"field1": "value1", "field2": "value2"}';
            break;
        case 'list':
            hint.textContent = 'Enter JSON array, e.g., ["item1", "item2", "item3"]';
            break;
        case 'set':
            hint.textContent = 'Enter JSON array, e.g., ["member1", "member2", "member3"]';
            break;
        case 'zset':
            hint.textContent = 'Enter JSON array of objects, e.g., [{"member": "item1", "score": 1}, {"member": "item2", "score": 2}]';
            break;
    }
}

// Save key (create or update)
async function saveKey() {
    const keyName = document.getElementById('keyName').value.trim();
    const keyType = document.getElementById('keyType').value;
    const keyTTL = parseInt(document.getElementById('keyTTL').value);
    const keyValue = document.getElementById('keyValue').value.trim();
    
    if (!keyName) {
        alert('Key name is required');
        return;
    }
    
    let value;
    try {
        if (keyType === 'string') {
            value = keyValue;
        } else {
            value = JSON.parse(keyValue);
            
            // Validate and transform zset format
            if (keyType === 'zset') {
                if (!Array.isArray(value)) {
                    throw new Error('Sorted set value must be an array of objects');
                }
                // Ensure each item has member and score
                value = value.map(item => {
                    if (!item.member || typeof item.score !== 'number') {
                        throw new Error('Each sorted set item must have "member" and "score" properties');
                    }
                    return item;
                });
            }
        }
    } catch (error) {
        alert(`Invalid value format: ${error.message}`);
        return;
    }
    
    try {
        if (isEditMode) {
            // Update existing key
            const response = await fetch(`${API_URL}/api/keys/${encodeURIComponent(keyName)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value, ttl: keyTTL })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update key');
            }
            
            alert('Key updated successfully');
        } else {
            // Create new key
            const response = await fetch(`${API_URL}/api/keys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: keyName, type: keyType, value, ttl: keyTTL })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create key');
            }
            
            alert('Key created successfully');
        }
        
        closeModal();
        await loadKeys();
        
        if (isEditMode) {
            await selectKey(keyName);
        }
    } catch (error) {
        console.error('Error saving key:', error);
        alert(`Error: ${error.message}`);
    }
}

// Delete key
async function deleteKey() {
    if (!selectedKey) return;
    
    if (!confirm(`Are you sure you want to delete "${selectedKey}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/keys/${encodeURIComponent(selectedKey)}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete key');
        }
        
        alert('Key deleted successfully');
        selectedKey = null;
        document.getElementById('emptyState').style.display = 'flex';
        document.getElementById('keyDetail').style.display = 'none';
        
        await loadKeys();
    } catch (error) {
        console.error('Error deleting key:', error);
        alert(`Error: ${error.message}`);
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}
