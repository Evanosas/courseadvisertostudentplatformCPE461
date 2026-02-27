async function getData() {
    try {
        const response = await fetch('/api/items');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const list = document.getElementById('items');
        list.innerHTML = '';
        data.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.name;
            list.appendChild(li);
        });
    } catch (err) {
        console.error(err);
    }
}

async function addItem(name) {
    try {
        const res = await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('Failed to add item');
        await getData();
    } catch (err) {
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    getData();
    const form = document.getElementById('addForm');
    form.addEventListener('submit', e => {
        e.preventDefault();
        const input = document.getElementById('itemName');
        const name = input.value.trim();
        if (name) {
            addItem(name);
            input.value = '';
        }
    });
});