document.getElementById('btn-test').addEventListener('click',async() =>{
    const fileInput = document.getElementById('registerFile');
    const response = document.getElementById('registerResponse');
    if (!fileInput.files[0]) {
                response.textContent = 'Error: Selecciona una imagen primero';
    }else{
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        try {
            const res = await fetch('/api/authentication/test/register', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            response.textContent = JSON.stringify(data.encode);
        } catch (error) {
            response.textContent = 'Error al enviar la imagen';
        }

    }
})

document.getElementById('copyRegisterResponse').addEventListener('click', function() {
    const text = document.getElementById('registerResponse').innerText;
    navigator.clipboard.writeText(text)
        .then(() => {
            this.textContent = '¡Copiado!';
            setTimeout(() => { this.textContent = '📋 Copiar'; }, 1500);
        })
        .catch(() => {
            this.textContent = 'Error';
            setTimeout(() => { this.textContent = '📋 Copiar'; }, 1500);
        });
});