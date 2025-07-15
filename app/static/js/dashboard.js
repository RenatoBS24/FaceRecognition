document.addEventListener('DOMContentLoaded', () => {
    getData()
})


function getData(){
    const id = localStorage.getItem('id-data-user')
    fetch(`/api/authentication/user-data/${id}`)
        .then(res => res.json())
        .then(data => {
            console.log(data)
        })
        .then(data => {
            document.getElementById('stat-number').innerHTML = data.logins
            document.getElementById('stat-time').innerHTML = data.last_access
            document.getElementById('status').innerHTML = data.state

        })
        .catch(err => console.log(err))
}