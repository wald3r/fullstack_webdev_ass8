const { ApolloServer, UserInputError, BadUserInputError, gql } = require('apollo-server')
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
      try{
        const author = await Author.find( {name: args.author } )
        let book = null
        if (author.length === 0){
          let newAuthor = new Author({
            name: args.author,
            born: null,
          })
          
          await newAuthor.save()
          book = new Book({author: newAuthor.id, title: args.title, published: args.published, genres: args.genres })
        }else{
          book = new Book({author: author.id, title: args.title, published: args.published, genres: args.genres })
        }
        await book.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
      return book
    },

    editAuthor: async (root, args) => {
        const authors = await Author.find({name: args.name})
        const newAuthors = authors.map(async author => {
          try{
            author.born = args.setBornTo
            await author.save()
            return author
          }catch(error){
            throw new UserInputError(error.message, {
              invalidArgs: args,
            })
          }
        })
        return newAuthors[0]
    },
  },

  Book: {
    author: async (root) => {
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
