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
            console.log(data);
            if(data.error_code){
                response.textContent = data.error_code;
            }else{
                response.textContent = JSON.stringify(data.encode);
            }

        } catch (error) {
            response.textContent = 'Error al enviar la imagen';
        }

    }
})
document.getElementById('btn-test-login').addEventListener('click', async () => {
    const fileInput = document.getElementById('registerFileLogin');
    const response = document.getElementById('wsStatus');
    const code = document.getElementById('code').value;

    if (!fileInput.files[0]) {
        response.textContent = 'Error: Selecciona una imagen primero';
    } else if (!code) {
        response.textContent = 'Error: Ingresa un código numérico válido';
    } else {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        try {
            const res = await fetch('/api/authentication/test/login/' + code, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.successful) {
                response.textContent = data.successful;
            } else if (data.error) {
                response.textContent = data.error;
            }
        } catch (error) {
            response.textContent = 'Error al enviar la imagen';
        }
    }
});

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

const codeInput = document.getElementById('code');
codeInput.addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, '');
});