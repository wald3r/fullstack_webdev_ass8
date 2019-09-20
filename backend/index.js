const { ApolloServer, UserInpuptError, gql } = require('apollo-server')
const uuid = require('uuid/v1')
const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
const config = require('./utils/config')
const {ObjectId} = require('mongodb')

mongoose.set('useFindAndModify', false)

mongoose.connect(config.DB_URI, { useNewUrlParser: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

/*
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
/*
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
]*/

const typeDefs = gql`
  type Book {
    title: String!
    author: Author!
    published: Int!
    id: String!
    genres: [String]
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int!
    id: String!
    
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String]
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
    allBooks(author: String, genre: String): [Book]
    allAuthors: [Author]
  }
`

const resolvers = {


  Mutation: {
    addBook: async (root, args) => {
      const author = await Author.find( {name: args.author } )
      let book = null
      if (author.length === 0){
        let newAuthor = new Author({
          name: args.author,
          born: null,
        })
        newAuthor.save()
        book = new Book({author: newAuthor.id, title: args.title, published: args.published, genres: args.genres })
      }else{
        book = new Book({author: author.id, title: args.title, published: args.published, genres: args.genres })
      }
      return book.save()
      
    },

    editAuthor: async (root, args) => {
        const authors = await Author.find({name: args.name})
        const newAuthors = authors.map(author => {
          author.born = args.setBornTo
          author.save()
         return author
          
        })
        return newAuthors[0]
    },
  },

  Book: {
    author: async (root) => {
      console.log("how import am i?")
      const author = await Author.findById(root.author)
      return{
        id: author.id,
        name: author.name,
      }
    }
  },

  Query: {
    hello: () => { return "world" },
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),

    allBooks: async (root, args) => {
      const books = await Book.find({})
      let author = null
      if (Object.prototype.hasOwnProperty.call(args, 'author')){
        author = await Author.find({name: args.author})
      }
      return books.filter(book => {
      
        if(isEmpty(args)){
          return books
        }

        else if(Object.prototype.hasOwnProperty.call(args, 'genre') && Object.prototype.hasOwnProperty.call(args, 'author')){
          if(book.author.equals(author[0].id) && book.genres.includes(args.genre)){
            return book
          }
        }
        
        else if (Object.prototype.hasOwnProperty.call(args, 'genre')) { 
          if(book.genres.includes(args.genre)){
            return book
          }
        }

        else if (Object.prototype.hasOwnProperty.call(args, 'author')) { 
          if(book.author.equals(author[0].id)){
            return book
          }
        }
      })
  },

    allAuthors: async () =>  {
      const authors = await Author.find({})
      const books = await Book.find({})
      return authors.map(o => ({born: o.born, bookCount: countBooksOfAuthor(o, books), name: o.name, id: o.id}))
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

const countBooksOfAuthor = (arg, books) => {
  const filteredBooks = books.filter(book => book.author.equals(arg.id))
  return filteredBooks.length
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
