const { ApolloServer, gql } = require('apollo-server')
const uuid = require('uuid/v1')

let authors = [
  {
    name: 'Robert Martin',
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: 'Martin Fowler',
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963
  },
  {
    name: 'Fyodor Dostoevsky',
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821
  },
  { 
    name: 'Joshua Kerievsky', // birthyear not known
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  { 
    name: 'Sandi Metz', // birthyear not known
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
]

/*
 * It would be more sensible to assosiate book and the author by saving 
 * the author id instead of the name to the book.
 * For simplicity we however save the author name.
*/

let books = [
  {
    title: 'Clean Code',
    published: 2008,
    author: 'Robert Martin',
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Agile software development',
    published: 2002,
    author: 'Robert Martin',
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ['agile', 'patterns', 'design']
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    author: 'Martin Fowler',
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    author: 'Joshua Kerievsky',
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'patterns']
  },  
  {
    title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
    published: 2012,
    author: 'Sandi Metz',
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'design']
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    author: 'Fyodor Dostoevsky',
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'crime']
  },
  {
    title: 'The Demon',
    published: 1872,
    author: 'Fyodor Dostoevsky',
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'revolution']
  },
]

const typeDefs = gql`
  type Book {
    title: String!
    published: Int
    author: String!
    id: ID!
    genres: [String!]
  }

  type Author {
    name: String!
    born: Int
    id: ID!
    bookCount: Int!
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]
    ): Book

    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author


  }

  type Query {
    hello: String!
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
  }
`

const resolvers = {


  Mutation: {
    addBook: (root, args) => {
      const book = { ...args, id:uuid() }
      const filtered = authors.filter(author => author.name === book.author)
      if(filtered.length === 0){
        const person = {
          name: book.author,
          id: uuid(),
        }
        authors = authors.concat(person)
      }
      books = books.concat(book)
      return book
    },

    editAuthor: (root, args) => {
        let person = null
        authors = authors.map(author => {
          if(author.name === args.name){
            person = author
            author.born = args.setBornTo
          }
          return author
        })
        return person
    },
  },

  Query: {
    hello: () => { return "world" },
    bookCount: () => books.length,
    authorCount: () => {
      const set = new Set()
      const filtered = authors.filter(author => {
        const duplicate = set.has(author.name)
        set.add(author.name)
        return !duplicate
      })
      return filtered.length
    },

    allBooks: (root, args) => books.filter(book => {
      if(isEmpty(args)){
        return book
      }

      else if(Object.prototype.hasOwnProperty.call(args, 'genre') && Object.prototype.hasOwnProperty.call(args, 'author')){
        if(book.author === args.author && book.genres.includes(args.genre)){
          return book
        }
      }
      
      else if (Object.prototype.hasOwnProperty.call(args, 'genre')) { 
        if(book.genres.includes(args.genre)){
          return book
        }
      }

      else if (Object.prototype.hasOwnProperty.call(args, 'author')) { 
        if(book.author === args.author){
          return book
        }
      }
    

    }),

    allAuthors: () =>  {
      const set = new Set()
      const filtered = authors.filter(author => {
        const duplicate = set.has(author.name)
        set.add(author.name)
        return !duplicate
      })
      return filtered.map(o => ({bookCount: countBooksOfAuthor(o), ...o}))
    },
  }
}

const isEmpty = (obj) => {
    for(var key in obj){
      if(obj.hasOwnProperty(key))
        return false
    }
    return true
}

const countBooksOfAuthor = (arg) => {
  const filteredBooks = books.filter(book => book.author === arg.name)
  return filteredBooks.length
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
