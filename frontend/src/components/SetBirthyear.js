import React, { useState } from 'react'
import { gql } from 'apollo-boost'
import { Query } from 'react-apollo'

const ALL_AUTHORS = gql`
{
  allAuthors {
    name,
    born,
    id
  }
}
`
  
const SelectAuthors = ({ authorSelected }) => (
    <Query query={ALL_AUTHORS}>
        {({ loading, error, data }) => {
            if(loading) return 'Loading...'
            if (error) return `Error! ${error.message}`
            
            return (
                <div>
                    Select name: <select name="author" onChange={authorSelected}>
                        {data.allAuthors.map(author => (
                            <option key={author.id} value={author.name} >
                                {author.name} 
                            </option>
                        ))}
                    </select>
                 </div>
            )
      }}
    </Query>
)

const SetBirthyear = (props) => {


    const [name, setName] = useState('')
    const [birthyear, setBirthyear] = useState('')

    if (!props.show) {
        return null
    }
  

    const handleSetBirthyear = async (event) => {
        event.preventDefault()
        console.log('setting birthyear...', name, birthyear)
        await props.setYear({
            variables: {name, birthyear}
        })

        setName('')
        setBirthyear('')

    }



    return (
        <div>
            <br></br>
            <h2>set birthyear</h2>
            <form onSubmit={handleSetBirthyear}>
            <div>
            <SelectAuthors authorSelected={({target}) => setName(target.value)}/>
            </div>
            <div>
                Birthyear: <input 
                                value={birthyear}
                                type='number'
                                onChange={( {target} ) => setBirthyear(Number(target.value))}
                            />
            </div>
            <button type='submit'>set birthyear</button>
            </form>
        </div>
    )



}


export default SetBirthyear
