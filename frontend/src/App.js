import React, { useState } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import SetBirthyear from './components/SetBirthyear'
import { gql } from 'apollo-boost'
import { useMutation, useSubscription ,useApolloClient } from '@apollo/react-hooks'
import { Query, Mutation } from 'react-apollo'
import LoginForm from './components/LoginForm'




const NEW_BOOK = gql`
  mutation newBook($title: String!, $author: String!, $published: Int!, $genres: [String!]){
     addBook(
      title: $title,
      author: $author,
      published: $published,
      genres: $genres
      ){
        title
        published
        genres
      }
}`


const NEW_BIRTHYEAR = gql `

  mutation setBirthyear($name: String!, $birthyear: Int!){
      editAuthor(
        name: $name,
        setBornTo: $birthyear
      ){
        name
        born
      }
  }`

const ALL_AUTHORS = gql`
{
  allAuthors {
    name,
    born,
    id,
    bookCount
  }
}
`

const ALL_BOOKS = gql`
{
  allBooks {
    title,
    published,
    genres,
    author{
      id,
      name
    }
  }
}
`

const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)  {
      value
    }
  }
`

const BOOK_ADDED = gql`
  subscription {
    bookAdded {
      title,
      genres,
      published
    }
  }
`

const App = () => {
  const [page, setPage] = useState('authors')
  const [token, setToken] = useState(null)

 

  const [login] = useMutation(LOGIN)

  const client = useApolloClient()

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      const addedBook = subscriptionData.data.bookAdded
      console.log(subscriptionData)
      window.alert(`New Book added: ${subscriptionData.data.bookAdded.title}`);
      updateCacheWith(addedBook)

    }
  })

  const updateCacheWith = (addedBook) => {
    const includedIn = (set, object) => 
      set.map(p => p.id).includes(object.id)  

    const dataInStore = client.readQuery({ query: ALL_BOOKS })
    if (!includedIn(dataInStore.allBooks, addedBook)) {
      dataInStore.allBooks.push(addedBook)
      client.writeQuery({
        query: ALL_BOOKS,
        data: dataInStore
      })
    }   
  }

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }

   if(token === null){
    return (
      <div>
        <h2>Login</h2>
        <LoginForm
          login={login}
          setToken={(token) => setToken(token)}
        />
      </div>
    )
   }else{
    return (
      <div>
      
        <div>
          <button onClick={() => setPage('authors')}>authors</button>
          <button onClick={() => setPage('books')}>books</button>
          <button onClick={() => setPage('add')}>add book</button>
          <button onClick={() => setPage('set')}>set birthyear</button>
          <button onClick={logout}>logout</button>
        </div>
  
        <Query query={ALL_AUTHORS}>
          {(result) => 
            <Authors
              show={page === 'authors'} result={result} 
            />}
        </Query>
  
        <Query query={ALL_BOOKS}>
          {(result) => 
            <Books
              show={page === 'books'} result={result}
            />}
        </Query>
        <Mutation 
          mutation={NEW_BOOK}
          refetchQueries={[{query: ALL_BOOKS},{query: ALL_AUTHORS}]}>
          {(addBook) => 
            <NewBook show={page ==='add'} addBook={addBook} />
          }
        </Mutation>
        <Mutation 
          mutation={NEW_BIRTHYEAR}
          refetchQueries={[{query: ALL_BOOKS},{query: ALL_AUTHORS}]}>
          {(setYear) => 
             <SetBirthyear show={page ==='set'} setYear={setYear}/> }      
        </Mutation>
      </div>
    )
   }
   
}

export default App