import React, { useState } from 'react'

const Books = (props) => {
  const [filter, setFilter] = useState('RESET')


  if (!props.show) {
    return null
  }

  if(props.result.loading){
    return <div>loading...</div>
  }
  const books = props.result.data.allBooks
  let filteredbooks = null
  if(filter !== 'RESET'){
    filteredbooks = books.filter(book => {
      const list = book.genres[0].split(', ')
      const variable = list.indexOf(filter)
      if(variable > -1){
        return true
      }
      else{
        return false
      }
    })
  }else{
    filteredbooks = books
  }


  const list = () => {
    const set = new Set()
    books.map(book => {
      const list = book.genres[0].split(', ')
      for(let x = 0; x < list.length; x++ ){
        set.add(list[x])
      }
      return book
    })
    return set
  }

  const handleClick = (e) => {
    e.preventDefault()
    console.log(filter)
  }

  if(books === null){
    return null
  }else{
    return (
      <div>
        <h2>books</h2>

        <table>
          <tbody>
            <tr>
              <th></th>
              <th>
                author
              </th>
              <th>
                published
              </th>
              <th>
                genres
              </th>
            </tr>
            {filteredbooks.map(a =>
              <tr key={a.title}>
                <td>{a.title}</td>
                <td>{a.author.name}</td>
                <td>{a.published}</td>
                <td>{a.genres}</td>
              </tr>
            )}
          </tbody>
        </table>
        <form onSubmit={handleClick}>
          {[...list()].map((book, x) => 
            <button key={x} onClick={() => setFilter(book)} type='submit'>{book}</button>)
          }
          <button onClick={() => setFilter('RESET')} type='submit'>RESET</button>
        </form>
      </div>
    )
  }
}

export default Books