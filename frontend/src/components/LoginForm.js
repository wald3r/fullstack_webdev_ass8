import React, { useState } from 'react'



const LoginForm = (props) => {

    const [username, setUsername] = useState('')
    // eslint-disable-next-line no-unused-vars
    const [password, setPassword] = useState('secred')


    const handleLogin = async (e) => {
        e.preventDefault()
        console.log(props)
        const result = await props.login({
            variables: { username, password }
        })
        console.log("test2")
        if(result){
            const token = result.data.login.value
            props.setToken(token)
            localStorage.setItem('whatever-user-token', token)
        }

        setUsername('')
    }


    return (
        <div>
            <form onSubmit={handleLogin}>

                username: <input value={username}
                                 onChange={({ target }) => setUsername(target.value)}/>

            <button type='submit'>login</button>
            </form>
        </div>
    )

}


export default LoginForm