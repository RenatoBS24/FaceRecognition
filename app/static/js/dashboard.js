document.addEventListener('DOMContentLoaded', () => {
    getData()
})


function getData() {
    const id = localStorage.getItem('id-data-user');
        fetch(`/api/authentication/user-data/${id}`)
        .then(res => res.json())
        .then(data => {
            console.log(data);
             const date = new Date(data.last_access);
             const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
             const dateformat = date.toLocaleDateString('es-ES', options);
             const timeFormat = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
            document.getElementById('stat-number').innerHTML = data.logins;
            document.getElementById('stat-time').innerHTML =`${dateformat} a las ${timeFormat}`;
            document.getElementById('status').innerHTML = '✅'+data.state;
            document.getElementById('code_user').innerHTML = 'Usuario:  <strong>' + data.code_user + '</strong>';
        })
        .catch(err => console.log(err));
}
