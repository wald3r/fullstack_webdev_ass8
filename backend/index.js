const { ApolloServer, UserInputError, AuthenticationError, gql } = require('apollo-server')
const uuid = require('uuid/v1')
const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const config = require('./utils/config')
const jwt = require('jsonwebtoken')
const { PubSub } = require('apollo-server')
const pubsub = new PubSub()


mongoose.set('useFindAndModify', false)

mongoose.connect(config.DB_URI, { useNewUrlParser: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })


const JWT_SECRET = 'NEED_HERE_A_SECRET_KEY'




const typeDefs = gql`
  type Book {
    title: String!
    author: Author!
    published: Int!
    id: String!
    genres: [String]
  }

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Author {
    name: String!
    born: Int
    id: String!
    bookCount: Int!
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

    createUser(
      username: String!
      favoriteGenre: String!
    ): User

    login(
      username: String!
      password: String!
    ): Token
  }

  type Query {
    hello: String!
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book]
    allAuthors: [Author]
    me: User
  }

  type Subscription {
    bookAdded: Book!
  }    
`

const resolvers = {


  Mutation: {

    createUser: (root, args) => {
      const user = new User({ 
        username: args.username,
        favoriteGenre: args.favoriteGenre                         
      })

      return user.save()
                 .catch(error => {
                   throw new UserInputError(error.message, {
                     invalidArgs: args,
                   })
                 })
    },

    login: async (root, args) => {
      
      const user = await User.findOne({ username: args.username })
  
      if ( !user || args.password !== 'secred' ) {
        throw new UserInputError("wrong credentials")
      }
  
      const userForToken = {
        username: user.username,
        id: user._id,
      }
  
      return { value: jwt.sign(userForToken, JWT_SECRET) }
    },

    addBook: async (root, args, { currentUser } ) => {
     
      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }
      let book = null
      try{
        const author = await Author.find( {name: args.author } )
        if (author.length === 0){
          let newAuthor = new Author({
            name: args.author,
            born: null,
          })                    
          await newAuthor.save()

          book = new Book({author: newAuthor.id, title: args.title, published: args.published, genres: args.genres })
        }else{
          book = new Book({author: author[0].id, title: args.title, published: args.published, genres: args.genres })
        }

        await book.save()

      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
      pubsub.publish('BOOK_ADDED', { bookAdded: book })
      return book
    },

    editAuthor: async (root, args, {currentUser}) => {
      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }
      try{
        var authors = null
        if(args.name === ''){
          const firstAuthor = await Author.find({})
          firstAuthor[0].born = args.setBornTo
          await firstAuthor[0].save()
          return firstAuthor[0]
        }else{
          authors = await Author.find({name: args.name})
        
          const newAuthors = authors.map(async author => {
              author.born = args.setBornTo
              await author.save()
              return author
          })
        }
      }catch(error){
        throw new UserInputError(error.message, {
          invalidArgs: args,
      })
    }
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

  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
    },
  },

  Query: {
    hello: () => { return "world" },
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    me: (root, args, context) => context.currentUser, 
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
  const filteredBooks = books.filter(book =>{
    if(book.author.equals(arg.id)){
      return book
    }
  })
  return filteredBooks.length
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), JWT_SECRET
      )
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  }
})

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`)
  console.log(`Subscriptions ready at ${subscriptionsUrl}`)
})
