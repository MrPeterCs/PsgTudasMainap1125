
import { useState, useEffect } from "react"
import Form from "react-bootstrap/Form"
import Button from "react-bootstrap/Button"

export default function MyEdit() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // Saját felhasználó lekérése
    async function getUsers() {
        try {
            const user = JSON.parse(localStorage.getItem("user"))
            if (!user) return
            const response = await fetch(`http://localhost:3001/api/users/${user.id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })
            const data = await response.json()
            if (response.ok) {
                setName(data.name)
                setEmail(data.email)
            }
            if (response.status === 401) {
                localStorage.removeItem("token")
                localStorage.removeItem("user")
                window.location.href = "/login"
            }
        } catch (error) {
            console.error("GET hiba:", error)
        }
    }
    useEffect(() => {
        getUsers()
    }, [])

    // Saját adatok módosítása
    async function saveUsers(e) {
        e.preventDefault()
        try {
            const user = JSON.parse(localStorage.getItem("user"))
            const response = await fetch(`http://localhost:3001/api/users/${user.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ name, email, password })
            })
            const data = await response.json()
            alert(data.message)
            if (response.status === 401) {
                localStorage.removeItem("token")
                localStorage.removeItem("user")
                window.location.href = "/login"
                return
            }
            if (response.ok) {
                setPassword("")
                await getUsers()
            }
        } catch (error) {
            alert("Szerverhiba!")
        }
    }

    return (
        <div className="container mt-4">
            <h1>Felhasználó</h1>
            <div className="row">
                <div className="col-md-8">
                    <h2>Adataim módosítása</h2>
                    <Form onSubmit={saveUsers}>
                        <Form.Group className="mb-3">
                            <Form.Label>A felhasználó neve</Form.Label>
                            <Form.Control value={name} onChange={e => setName(e.target.value)} placeholder="A felhasználó neve" required/>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Emailod</Form.Label>
                            <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Emailod" required/>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Jelszó</Form.Label>
                            <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Új jelszó but its not that deep" if/></Form.Group>
                        <Button type="submit" variant="primary">Módosítás</Button>
                    </Form>
                </div>
            </div>
        </div>
    )
}
